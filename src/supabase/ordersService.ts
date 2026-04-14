import { supabase } from './supabaseClient';
import type { Order, OrderItem } from '../types/domain';
import { offlineStorage } from '../offline/storage';
import { AppError, toAppError } from '../utils/appError';
import { logger } from '../utils/logger';

// ── Composite types ─────────────────────────────────────────────────────

export type OrderWithParty = Order & {
  parties?: {
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
};

const createTempOrderId = (): string =>
  `temp-order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const buildPendingOrder = (
  orgId: string,
  userId: string,
  payload: CreateOrderPayload,
  tempOrderId: string,
): OrderWithItems => {
  const nowIso = new Date().toISOString();
  const pendingItems: OrderItem[] = payload.items.map((item, index) => ({
    id: `${tempOrderId}-item-${index + 1}`,
    order_id: tempOrderId,
    organization_id: orgId,
    product_id: item.product_id ?? null,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    tax_rate: item.tax_rate ?? item.gst_rate ?? 0,
    tax_amount: item.tax_amount ?? item.gst_amount ?? 0,
    hsn: item.hsn ?? null,
    gst_rate: item.gst_rate ?? 0,
    gst_amount: item.gst_amount ?? 0,
    discount_amount: item.discount_amount ?? 0,
    mrp: item.mrp ?? 0,
    batch_id: item.batch_id ?? null,
    is_returned: false,
    created_at: nowIso,
  }));

  return {
    id: tempOrderId,
    organization_id: orgId,
    invoice_number: payload.order.invoice_number,
    invoice_sequence: payload.order.invoice_sequence ?? null,
    invoice_type: payload.order.invoice_type ?? 'sale',
    status: 'pending',
    payment_status: payload.order.payment_status ?? 'PENDING',
    payment_method: payload.order.payment_method ?? undefined,
    subtotal: payload.order.subtotal,
    tax_amount: payload.order.tax_amount,
    total_amount: payload.order.total_amount,
    total_tax: payload.order.total_tax ?? payload.order.tax_amount ?? 0,
    total_discount: payload.order.total_discount ?? 0,
    received_amount: payload.order.received_amount ?? 0,
    change_amount: payload.order.change_amount ?? 0,
    notes: payload.order.notes ?? null,
    party_id: payload.order.party_id ?? null,
    customer_id: payload.order.customer_id ?? null,
    is_cancelled: false,
    created_by: userId,
    created_at: nowIso,
    updated_at: nowIso,
    order_items: pendingItems,
  };
};

export type CreateOrderPayload = {
  order: Omit<
    Order,
    'id' | 'organization_id' | 'items' | 'party' | 'created_at' | 'updated_at'
  >;
  items: Array<
    Pick<
      OrderItem,
      'product_id' | 'product_name' | 'quantity' | 'unit_price' | 'total_price'
    > & {
      hsn?: string | null;
      gst_rate?: number;
      gst_amount?: number;
      tax_rate?: number;
      tax_amount?: number;
      mrp?: number;
      discount_amount?: number;
      batch_id?: string | null;
    }
  >;
  productIds?: (string | null)[];
};

export type UpdateOrderPayload = {
  orderId: string;
  order: Partial<Omit<Order, 'id' | 'organization_id' | 'items' | 'party'>>;
  items?: CreateOrderPayload['items'];
};

// ── Service ─────────────────────────────────────────────────────────────

export const ordersService = {
  /**
   * List orders with optional search and status filter.
   */
  async listOrders(
    orgId: string,
    params: { search?: string; status?: string } = {},
  ): Promise<OrderWithParty[]> {
    const { search, status } = params;

    try {
      let query = supabase
        .from('orders')
        .select('*, parties!orders_party_id_fkey(name, phone, email)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (status && status !== 'All') {
        query = query.eq('status', status.toLowerCase());
      }

      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(
          `invoice_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`,
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[Orders] Failed to fetch', error);
        throw toAppError('orders.list', error, 'Unable to load orders.');
      }

      const rows = (data ?? []) as OrderWithParty[];
      await offlineStorage.setCache('orders', rows);
      return rows;
    } catch (error) {
      logger.error('[Orders] Falling back to offline cache', error);
      const cached = await offlineStorage.getCache<OrderWithParty[]>('orders');
      if (cached) return cached;
      throw toAppError(
        'orders.offline',
        error,
        'Unable to load orders. Please check your connection.',
        {
          code: 'offline',
        },
      );
    }
  },

  /**
   * Get a single order with its items.
   */
  async getOrderById(id: string): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('[Orders] Failed to fetch order detail', error);
      return null;
    }

    if (!data) return null;
    return data as OrderWithItems;
  },

  /**
   * Create an order with items.
   */
  async createOrder(
    orgId: string,
    payload: CreateOrderPayload,
  ): Promise<OrderWithItems> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) throw new Error('User not authenticated');

    const { order, items, productIds } = payload;

    try {
      // 1. Insert the order
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...order,
          organization_id: orgId,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (orderError) {
        throw toAppError(
          'orders.create',
          orderError,
          'Unable to create order.',
        );
      }

      const orderId = insertedOrder.id;

      // 2. Insert order items
      if (items.length > 0) {
        const orderItems = items.map(item => ({
          ...item,
          order_id: orderId,
          organization_id: orgId,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          logger.error('[Orders] Failed to create order items, deleting orphaned header', itemsError);
          // Manually delete the orphaned order header
          await supabase.from('orders').delete().eq('id', orderId);

          throw toAppError(
            'orders.create.items',
            itemsError,
            'Failed to add items, order header deleted to prevent corruption.',
          );
        }
      }

      // 3. Adjust product stock (decrease on sale)
      try {
        const productQuantities = new Map<string, number>();
        for (let i = 0; i < items.length; i++) {
          const pId = productIds?.[i] ?? items[i].product_id;
          const qty = items[i].quantity;
          if (!pId || !qty) continue;
          productQuantities.set(pId, (productQuantities.get(pId) ?? 0) + qty);
        }

        if (productQuantities.size > 0) {
          const pIds = Array.from(productQuantities.keys());
          const { data: prods } = await supabase
            .from('products')
            .select('id, stock_quantity')
            .in('id', pIds);

          for (const prod of prods ?? []) {
            const decrease = productQuantities.get(prod.id as string) ?? 0;
            const currentStock = (prod.stock_quantity as number) ?? 0;
            await supabase
              .from('products')
              .update({ stock_quantity: Math.max(0, currentStock - decrease) })
              .eq('id', prod.id);
          }

          // 4. Create stock_ledger entries
          const ledgerEntries = Array.from(productQuantities.entries()).map(
            ([productId, qty]) => ({
              organization_id: orgId,
              product_id: productId,
              quantity_change: -qty,
              movement_type: 'SALE',
              reference_id: orderId,
              notes: `Order #${order.invoice_number}`,
              created_by: user.id,
            }),
          );

          await supabase.from('stock_ledger').insert(ledgerEntries);
        }
      } catch (stockErr) {
        logger.error('[Orders] Stock adjustment failed', stockErr);
        // Order is already created, stock will be reconciled later
      }

      // 5. Return the created order with items
      const withItems = await this.getOrderById(orderId);
      if (!withItems) {
        throw new AppError('server', 'Order created but cannot fetch details.');
      }
      return withItems;
    } catch (error: any) {
      const appError =
        error instanceof AppError
          ? error
          : toAppError('orders.create', error, 'Unable to create order.');

      if (appError.code === 'offline') {
        const { queueMutation } = await import('../utils/offlineQueue');
        const tempOrderId = createTempOrderId();
        await queueMutation('order', 'create', {
          organization_id: orgId,
          ...payload,
          temp_id: tempOrderId,
          pending: true,
        });
        logger.log('[Offline] Queued order creation for sync');
        return buildPendingOrder(orgId, user.id, payload, tempOrderId);
      }

      throw appError;
    }
  },

  /**
   * Update order fields (status, dates, notes).
   */
  async updateOrder(
    id: string,
    updates: Partial<Omit<Order, 'id' | 'organization_id' | 'items' | 'party'>>,
    itemsPayload?: CreateOrderPayload['items']
  ): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw toAppError('orders.update', error, 'Unable to update order.');
    }

    if (itemsPayload) {
      const orgId = data.organization_id;
      // Delete existing items
      await supabase.from('order_items').delete().eq('order_id', id);
      // Insert new items
      const orderItems = itemsPayload.map(item => ({
        ...item,
        order_id: id,
        organization_id: orgId,
      }));
      await supabase.from('order_items').insert(orderItems);
    }

    return data as Order;
  },

  /**
   * Update order status shorthand.
   */
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.updateOrder(id, { status });
  },

  /**
   * Cancel an order and restore stock.
   */
  async cancelOrder(orgId: string, id: string): Promise<Order> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    // 1. Get the order with items for stock restoration
    const orderWithItems = await this.getOrderById(id);
    if (!orderWithItems) {
      throw new AppError('server', 'Order not found.');
    }

    // 2. Mark as cancelled
    const { data, error } = await supabase
      .from('orders')
      .update({
        is_cancelled: true,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw toAppError('orders.cancel', error, 'Unable to cancel order.');
    }

    // 3. Restore stock
    try {
      for (const item of orderWithItems.order_items) {
        if (!item.product_id || !item.quantity || item.is_returned) continue;

        const { data: prod } = await supabase
          .from('products')
          .select('id, stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (prod) {
          const currentStock = (prod.stock_quantity as number) ?? 0;
          await supabase
            .from('products')
            .update({ stock_quantity: currentStock + item.quantity })
            .eq('id', prod.id);
        }
      }

      // Create reversal ledger entries
      const reversals = orderWithItems.order_items
        .filter(item => item.product_id && item.quantity)
        .map(item => ({
          organization_id: orgId,
          product_id: item.product_id!,
          quantity_change: item.quantity,
          movement_type: 'CANCELLATION',
          reference_id: id,
          notes: `Cancellation of Order #${orderWithItems.invoice_number}`,
          created_by: user?.id ?? null,
        }));

      if (reversals.length > 0) {
        await supabase.from('stock_ledger').insert(reversals);
      }
    } catch (stockErr) {
      logger.error(
        '[Orders] Stock restoration failed after cancellation',
        stockErr,
      );
    }

    return data as Order;
  },

  /**
   * Delete an order.
   */
  async deleteOrder(id: string): Promise<void> {
    // Delete items first
    const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', id);
    if (itemsError) {
      throw toAppError('orders.delete.items', itemsError, 'Unable to delete order items.');
    }

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      throw toAppError('orders.delete', error, 'Unable to delete order.');
    }
  },
};
