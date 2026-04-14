import { supabase } from './supabaseClient';
import { AppError, toAppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type PurchaseOrderItem = {
  id?: string;
  purchase_order_id?: string;
  product_id?: string;
  product_name: string;
  sku?: string | null;
  quantity: number;
  unit?: string | null;
  unit_price: number;
  total_price: number;
  batch_id?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  mfg_date?: string | null;
  received_quantity?: number;
  item_status?: string;
  selling_price?: number;
  mrp?: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PurchaseOrder = {
  id: string;
  organization_id: string;
  user_id: string;
  order_number: string;
  vendor_name?: string | null;
  vendor_phone?: string | null;
  vendor_id?: string | null;
  party_id?: string | null;
  vendor_address?: string | null;
  order_date: string;
  total_quantity: number;
  total_amount: number;
  paid_amount?: number;
  notes?: string | null;
  status?: string | null;
  workflow_status?: string;
  payment_status?: string;
  expected_delivery_date?: string | null;
  is_received?: boolean;
  created_at?: string;
  updated_at?: string;
  purchase_order_items?: PurchaseOrderItem[];
};

export type CreatePurchasePayload = {
  purchase: Omit<
    PurchaseOrder,
    'id' | 'user_id' | 'organization_id' | 'purchase_order_items'
  >;
  items: Array<Omit<PurchaseOrderItem, 'id' | 'purchase_order_id'>>;
};

export interface POReceiveItem {
  item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  received_qty: number;
  buy_price?: number;
  sell_price?: number;
  mrp?: number;
  batch_number?: string | null;
  mfg_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
}

export const purchasesService = {
  async listPurchases(
    orgId: string,
    params: { search?: string; status?: string } = {},
  ): Promise<PurchaseOrder[]> {
    const { search, status } = params;

    let query = supabase
      .from('purchase_orders')
      .select('*, purchase_order_items(*)')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false });

    if (status && status !== 'All') {
      query = query.eq('status', status.toLowerCase());
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(
        `order_number.ilike.%${term}%,vendor_name.ilike.%${term}%,vendor_phone.ilike.%${term}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[Purchases] Failed to fetch', error);
      throw toAppError('purchases.list', error, 'Unable to load purchases.');
    }

    return (data ?? []) as PurchaseOrder[];
  },

  async getPurchaseById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, purchase_order_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('[Purchases] Failed to fetch detail', error);
      throw new Error('Unable to load purchase.');
    }

    if (!data) return null;
    return data as PurchaseOrder;
  },

  async createPurchase(
    orgId: string,
    payload: CreatePurchasePayload,
  ): Promise<PurchaseOrder> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) throw new Error('User not authenticated');

    const { purchase, items } = payload;

    const { data: insertedPurchase, error: purchaseError } = await supabase
      .from('purchase_orders')
      .insert({
        ...purchase,
        organization_id: orgId,
        user_id: user.id,
      })
      .select('*')
      .single();

    if (purchaseError) {
      throw toAppError(
        'purchases.create',
        purchaseError,
        'Unable to create purchase.',
      );
    }

    const purchaseId = insertedPurchase.id;

    if (items.length > 0) {
      const itemsWithPurchase = items.map(item => ({
        ...item,
        purchase_order_id: purchaseId,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsWithPurchase);

      if (itemsError) {
        logger.error('[Purchases] Failed to create items', itemsError);
        throw toAppError(
          'purchases.create.items',
          itemsError,
          'Purchase saved, but adding items failed.',
        );
      }

      // Update product stock_quantity
      try {
        const productQuantities = new Map<string, number>();
        for (const item of itemsWithPurchase) {
          if (!item.product_id || !item.quantity) continue;
          const current = productQuantities.get(item.product_id) ?? 0;
          productQuantities.set(item.product_id, current + item.quantity);
        }

        if (productQuantities.size > 0) {
          const productIds = Array.from(productQuantities.keys());
          const { data: productRows, error: productsError } = await supabase
            .from('products')
            .select('id, stock_quantity')
            .in('id', productIds);

          if (productsError) {
            logger.error(
              '[Purchases] Failed to read products for stock',
              productsError,
            );
          } else {
            for (const row of productRows ?? []) {
              const increment = productQuantities.get(row.id as string) ?? 0;
              const currentStock = (row.stock_quantity as number) ?? 0;
              await supabase
                .from('products')
                .update({ stock_quantity: currentStock + increment })
                .eq('id', row.id);
            }
          }
        }
      } catch (stockError) {
        logger.error('[Purchases] Stock update failed', stockError);
      }
    }

    const withItems = await this.getPurchaseById(purchaseId);
    if (!withItems) {
      throw new AppError(
        'server',
        'Purchase created but cannot fetch details.',
      );
    }
    return withItems;
  },

  async updatePurchaseStatus(
    orgId: string,
    id: string,
    status: string,
  ): Promise<PurchaseOrder> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('*')
      .single();

    if (error) {
      throw toAppError(
        'purchases.update',
        error,
        'Unable to update purchase status.',
      );
    }

    if (!data) {
      throw new AppError('server', 'Purchase not found or access denied.');
    }

    const withItems = await this.getPurchaseById(id);
    if (!withItems) {
      throw new AppError(
        'server',
        'Purchase updated but cannot fetch details.',
      );
    }
    return withItems;
  },

  async receiveAndVerifyItems(params: {
    p_po_id: string;
    p_organization_id: string;
    p_items: POReceiveItem[];
  }): Promise<{ success: boolean; message: string; grn_id?: string }> {
    const { data, error } = await supabase.rpc('receive_purchase_order_items', params);
    
    if (error) {
      logger.error('[Purchases] receiveAndVerifyItems failed', error);
      throw toAppError('purchases.receive', error, 'Failed to process item receipt and create GRN.');
    }
    
    return data as { success: boolean; message: string; grn_id?: string };
  },
};
