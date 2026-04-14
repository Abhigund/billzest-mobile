import { supabase } from './supabaseClient';
import { Database } from '../database.types';
import { toAppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type BillConfigRow = Database['public']['Tables']['bill_config']['Row'];

export type BillConfigInput = {
  header_text?: string | null;
  footer_text?: string | null;
  show_logo?: boolean;
  show_tax_details?: boolean;
  font_size?: string;
  paper_size?: string;
  logo_url?: string | null;
  print_qr_code?: boolean;
  qr_code_data?: string | null;
};

export const billConfigService = {
  /**
   * Get bill config for the organization.
   */
  async getConfig(orgId: string): Promise<BillConfigRow | null> {
    const { data, error } = await supabase
      .from('bill_config')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.error('[BillConfig] Failed to fetch config', error);
      throw toAppError(
        'billConfig.fetch',
        error,
        'Unable to load bill settings.',
      );
    }

    return (data as BillConfigRow | null) ?? null;
  },

  /**
   * Save (upsert) bill config for the organization.
   */
  async saveConfig(
    orgId: string,
    input: BillConfigInput,
  ): Promise<BillConfigRow> {
    const existing = await this.getConfig(orgId);

    if (!existing) {
      const { data, error } = await supabase
        .from('bill_config')
        .insert({
          ...input,
          organization_id: orgId,
        })
        .select('*')
        .single();

      if (error) {
        logger.error('[BillConfig] Failed to create config', error);
        throw toAppError(
          'billConfig.create',
          error,
          'Unable to save bill settings.',
        );
      }

      return data as BillConfigRow;
    }

    const { data, error } = await supabase
      .from('bill_config')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      logger.error('[BillConfig] Failed to update config', error);
      throw toAppError(
        'billConfig.update',
        error,
        'Unable to update bill settings.',
      );
    }

    return data as BillConfigRow;
  },
};
