import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import type { Category } from '../types/domain';

/**
 * Service for category CRUD operations.
 */
export const categoriesService = {
  /**
   * Fetch all categories for an organization.
   */
  async getCategories(orgId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*, products(count)')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('name');

    if (error) {
      logger.error('[CategoriesService] getCategories failed', error.message);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      ...row,
      product_count: Array.isArray(row.products) ? (row.products[0]?.count ?? 0) : 0,
      products: undefined,
    })) as Category[];
  },

  /**
   * Create a new category.
   */
  async createCategory(
    orgId: string,
    input: {
      name: string;
      icon?: string;
      gst_rate?: number;
      parent_id?: string;
    },
  ): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        organization_id: orgId,
        name: input.name,
        icon: input.icon ?? null,
        gst_rate: input.gst_rate ?? null,
        parent_id: input.parent_id ?? null,
      })
      .select('*')
      .single();

    if (error || !data) {
      logger.error('[CategoriesService] createCategory failed', error?.message);
      return null;
    }

    return data as Category;
  },

  /**
   * Update an existing category.
   */
  async updateCategory(
    id: string,
    updates: Partial<
      Pick<Category, 'name' | 'icon' | 'gst_rate' | 'is_active'>
    >,
  ): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      logger.error('[CategoriesService] updateCategory failed', error?.message);
      return null;
    }

    return data as Category;
  },

  /**
   * Soft-delete a category.
   */
  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error('[CategoriesService] deleteCategory failed', error.message);
      return false;
    }

    return true;
  },
};
