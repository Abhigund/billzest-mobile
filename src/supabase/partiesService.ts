import { supabase } from './supabaseClient';
import { Party } from '../types/domain';
import { toAppError, AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const mapPartyRow = (row: Record<string, any>): Party => ({
  id: row.id,
  organization_id: row.organization_id,
  name: row.name ?? 'Untitled Party',
  type: row.type ?? 'CUSTOMER',
  party_type: row.party_type ?? null,
  email: row.email ?? null,
  phone: row.phone ?? null,
  mobile: row.mobile ?? null,
  address: row.address ?? null,
  notes: row.notes ?? null,
  gst_number: row.gst_number ?? null,
  balance: row.balance ?? 0,
  billing_address: row.billing_address ?? {},
  shipping_address: row.shipping_address ?? {},
  wallet_balance: row.wallet_balance ?? 0,
  credit_limit: row.credit_limit ?? 0,
  credit_limit_enabled: row.credit_limit_enabled ?? false,
  deleted_at: row.deleted_at ?? null,
  due_date: row.due_date ?? null,
  display_id: row.display_id ?? null,
  created_at: row.created_at ?? undefined,
  updated_at: row.updated_at ?? undefined,
});

export const partiesService = {
  /**
   * Fetch parties for the organization, optionally filtered by type.
   */
  async getParties(orgId: string, type?: string): Promise<Party[]> {
    let query = supabase
      .from('parties')
      .select('*')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[Parties] Failed to fetch parties', error);
      throw toAppError('parties.list', error, 'Unable to load parties.');
    }

    return (data ?? []).map(mapPartyRow);
  },

  /**
   * Get a single party by ID.
   */
  async getPartyById(id: string): Promise<Party | null> {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('[Parties] Error fetching party by ID:', error);
      return null;
    }

    if (!data) return null;
    return mapPartyRow(data);
  },

  /**
   * Find a party by phone number within the organization.
   */
  async findPartyByPhone(orgId: string, phone: string): Promise<Party | null> {
    const normalizedPhone = phone.trim();

    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .or(`phone.eq.${normalizedPhone},mobile.eq.${normalizedPhone}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw toAppError(
        'parties.findByPhone',
        error,
        'Unable to check for duplicate parties.',
      );
    }

    if (!data) return null;
    return mapPartyRow(data);
  },

  /**
   * Create a new party.
   */
  async createParty(
    orgId: string,
    party: Omit<Party, 'id' | 'organization_id' | 'created_at' | 'updated_at'>,
  ): Promise<Party> {
    const { data, error } = await supabase
      .from('parties')
      .insert({
        ...party,
        organization_id: orgId,
      })
      .select()
      .single();

    if (error) {
      if (error?.code === '23505') {
        throw new AppError('conflict', 'This party already exists.', {
          cause: error,
        });
      }
      throw toAppError('parties.create', error, 'Unable to save party.');
    }

    return mapPartyRow(data);
  },

  /**
   * Update an existing party.
   */
  async updateParty(
    id: string,
    updates: Partial<
      Omit<Party, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
    >,
  ): Promise<Party> {
    const { data, error } = await supabase
      .from('parties')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw toAppError(
        'parties.update',
        error,
        'Unable to update party details.',
      );
    }

    return mapPartyRow(data);
  },

  /**
   * Soft-delete a party.
   */
  async deleteParty(id: string): Promise<void> {
    const { error } = await supabase
      .from('parties')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw toAppError('parties.delete', error, 'Unable to delete party.');
    }
  },
};
