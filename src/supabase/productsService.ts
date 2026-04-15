import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { Product } from '../types/domain';
import { toAppError } from '../utils/appError';

const mapProductRow = (row: Record<string, any>): Product => ({
  id: row.id,
  organization_id: row.organization_id,
  name: row.name ?? 'Untitled Item',
  name_secondary: row.name_secondary ?? null,
  sku: row.sku ?? null,
  hsn: row.hsn ?? null,
  barcode: row.barcode ?? '',
  unit: row.unit ?? 'pcs',
  inventory_unit: row.inventory_unit ?? null,
  invoice_unit: row.invoice_unit ?? null,
  price_basis: row.price_basis ?? 'PER_INVENTORY_UNIT',
  base_quantity: row.base_quantity ?? 1,
  selling_price: row.selling_price ?? 0,
  purchase_price: row.purchase_price ?? 0,
  mrp: row.mrp ?? 0,
  stock_quantity: row.stock_quantity ?? 0,
  tax_rate: row.tax_rate ?? 0,
  category_id: row.category_id ?? null,
  image_url: row.image_url ?? null,
  images: row.images ?? [],
  description: row.description ?? null,
  is_active: row.is_active ?? true,
  is_inventory_tracked: row.is_inventory_tracked ?? true,
  has_variants: row.has_variants ?? false,
  low_stock_threshold: row.low_stock_threshold ?? 5,
  deleted_at: row.deleted_at ?? null,
  expiry_date: row.expiry_date ?? null,
  created_at: row.created_at ?? undefined,
  updated_at: row.updated_at ?? undefined,
});

export const productsService = {
  /**
   * Fetch all active products for the given organization.
   */
  async getProducts(orgId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('[Products] Failed to fetch products', error);
      throw toAppError('products.get', error, 'Unable to load products.');
    }

    return (data ?? []).map(mapProductRow);
  },

  /**
   * Get a single product by ID.
   */
  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) return null;
    return mapProductRow(data);
  },

  /**
   * Check if a barcode already exists within the organization.
   */
  async checkBarcodeExists(
    orgId: string,
    barcode: string,
    excludeId?: string,
  ): Promise<boolean> {
    if (!barcode.trim()) return false;

    let query = supabase
      .from('products')
      .select('id')
      .eq('organization_id', orgId)
      .eq('barcode', barcode.trim())
      .is('deleted_at', null);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.warn('[Products] Error checking barcode existence', error);
      return false;
    }

    return data !== null;
  },

  /**
   * Check if a SKU already exists within the organization.
   */
  async checkSkuExists(
    orgId: string,
    sku: string,
    excludeId?: string,
  ): Promise<boolean> {
    if (!sku.trim()) return false;

    let query = supabase
      .from('products')
      .select('id')
      .eq('organization_id', orgId)
      .eq('sku', sku.trim())
      .is('deleted_at', null);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.warn('[Products] Error checking SKU existence', error);
      return false;
    }

    return data !== null;
  },

  /**
   * Create a new product.
   */
  async createProduct(
    orgId: string,
    product: Omit<
      Product,
      'id' | 'organization_id' | 'created_at' | 'updated_at'
    >,
  ): Promise<Product> {
    // Check barcode uniqueness if provided
    if (product.barcode && product.barcode.trim()) {
      const barcodeExists = await this.checkBarcodeExists(
        orgId,
        product.barcode,
      );
      if (barcodeExists) {
        throw new Error(
          `Barcode ${product.barcode} already exists. Please use a different barcode.`,
        );
      }
    }

    // Check SKU uniqueness if provided
    if (product.sku && product.sku.trim()) {
      const skuExists = await this.checkSkuExists(orgId, product.sku);
      if (skuExists) {
        throw new Error(
          `SKU ${product.sku} already exists. Please use a different SKU.`,
        );
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        organization_id: orgId,
      })
      .select()
      .single();

    if (error) {
      throw toAppError('products.create', error, 'Unable to create product.');
    }

    return mapProductRow(data);
  },

  /**
   * Update an existing product.
   */
  async updateProduct(
    orgId: string,
    id: string,
    updates: Partial<Product>,
  ): Promise<Product> {
    // Check barcode uniqueness if being updated
    if (updates.barcode && updates.barcode.trim()) {
      const barcodeExists = await this.checkBarcodeExists(
        orgId,
        updates.barcode,
        id,
      );
      if (barcodeExists) {
        throw new Error(
          `Barcode ${updates.barcode} already exists. Please use a different barcode.`,
        );
      }
    }

    // Check SKU uniqueness if being updated
    if (updates.sku && updates.sku.trim()) {
      const skuExists = await this.checkSkuExists(orgId, updates.sku, id);
      if (skuExists) {
        throw new Error(
          `SKU ${updates.sku} already exists. Please use a different SKU.`,
        );
      }
    }

    // Remove fields that should not be sent to DB
    const { category, ...dbUpdates } = updates as any;

    const { data, error } = await supabase
      .from('products')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw toAppError('products.update', error, 'Unable to update product.');
    }

    return mapProductRow(data);
  },

  /**
   * Soft-delete a product.
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id);

    if (error) {
      throw toAppError('products.delete', error, 'Unable to delete product.');
    }
  },

  /**
   * Find a product by barcode for fast lookup from scanner.
   */
  async findProductByBarcode(
    orgId: string,
    barcode: string,
  ): Promise<Product | null> {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgId)
      .eq('barcode', barcode)
      .is('deleted_at', null)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    const totalTime = Date.now() - startTime;

    if (error && error.code !== 'PGRST116') {
      logger.error('[Products] Failed to lookup product by barcode', error);
      throw toAppError(
        'products.lookupBarcode',
        error,
        'Unable to lookup product by barcode.',
      );
    }

    logger.log('[Barcode Lookup]', {
      barcode,
      found: !!data,
      totalTimeMs: totalTime,
    });

    if (totalTime > 1000) {
      logger.warn('[Barcode Lookup] Query exceeded 1 second', {
        totalTimeMs: totalTime,
      });
    }

    if (!data) return null;
    return mapProductRow(data);
  },
};
