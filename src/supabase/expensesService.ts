import { supabase } from './supabaseClient';
import { toAppError } from '../utils/appError';
import { logger } from '../utils/logger';

/**
 * Expenses are modeled as parties with type='expense' and transactions stored
 * as credit_transactions. This service wraps both tables.
 */

export type Expense = {
  id: string; // credit_transaction id
  organization_id: string;
  party_id: string; // The expense-category party
  party_name: string;
  amount: number;
  date: string; // ISO date
  description: string | null;
  reference_number: string | null;
  created_at: string | null;
};

export const expensesService = {
  /**
   * List expenses = credit_transactions where party.type = 'expense'.
   * We join with parties to get the category name.
   */
  async listExpenses(
    orgId: string,
    params: { startDate?: string; endDate?: string } = {},
  ): Promise<Expense[]> {
    const { startDate, endDate } = params;

    // First get expense-type party IDs for this org
    const { data: expenseParties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name')
      .eq('organization_id', orgId)
      .eq('type', 'expense')
      .is('deleted_at', null);

    if (partiesError) {
      logger.error(
        '[Expenses] Failed to fetch expense parties',
        partiesError,
      );
      throw toAppError(
        'expenses.list',
        partiesError,
        'Unable to load expense categories.',
      );
    }

    if (!expenseParties || expenseParties.length === 0) {
      return [];
    }

    const partyIds = expenseParties.map(p => p.id);
    const partyNameMap = new Map(expenseParties.map(p => [p.id, p.name]));

    // Fetch credit_transactions for those parties
    let query = supabase
      .from('credit_transactions')
      .select(
        'id, organization_id, party_id, amount, date, description, reference_number, created_at',
      )
      .eq('organization_id', orgId)
      .in('party_id', partyIds)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[Expenses] Failed to fetch expense transactions', error);
      throw toAppError('expenses.list', error, 'Unable to load expenses.');
    }

    return (data ?? []).map(row => ({
      id: row.id,
      organization_id: row.organization_id,
      party_id: row.party_id,
      party_name: partyNameMap.get(row.party_id) ?? 'Unknown',
      amount: row.amount ?? 0,
      date: row.date,
      description: row.description ?? null,
      reference_number: row.reference_number ?? null,
      created_at: row.created_at ?? null,
    }));
  },

  /**
   * Create an expense = create a credit_transaction against an expense-type party.
   * If the party (category) doesn't exist yet, create it first.
   */
  async createExpense(
    orgId: string,
    userId: string,
    input: {
      category: string; // Maps to party name of type='expense'
      amount: number;
      date: string;
      description?: string;
      payment_method?: string;
    },
  ): Promise<Expense> {
    // 1. Find or create the expense-category party
    let partyId: string;

    const { data: existing } = await supabase
      .from('parties')
      .select('id')
      .eq('organization_id', orgId)
      .eq('type', 'expense')
      .eq('name', input.category)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      partyId = existing.id;
    } else {
      const { data: newParty, error: partyError } = await supabase
        .from('parties')
        .insert({
          organization_id: orgId,
          name: input.category,
          type: 'expense',
        })
        .select('id')
        .single();

      if (partyError || !newParty) {
        throw toAppError(
          'expenses.create',
          partyError,
          'Unable to create expense category.',
        );
      }
      partyId = newParty.id;
    }

    // 2. Create the credit_transaction
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        organization_id: orgId,
        user_id: userId,
        party_id: partyId,
        type: 'given',
        amount: input.amount,
        date: input.date,
        description: input.description ?? null,
        reference_number: input.payment_method ?? null,
      })
      .select(
        'id, organization_id, party_id, amount, date, description, reference_number, created_at',
      )
      .single();

    if (error || !data) {
      throw toAppError(
        'expenses.create',
        error,
        'Unable to create expense.',
      );
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      party_id: data.party_id,
      party_name: input.category,
      amount: data.amount,
      date: data.date,
      description: data.description ?? null,
      reference_number: data.reference_number ?? null,
      created_at: data.created_at ?? null,
    };
  },

  /**
   * Delete an expense (credit_transaction).
   */
  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('credit_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      throw toAppError('expenses.delete', error, 'Unable to delete expense.');
    }
  },

  /**
   * Get total expenses for an organization in a given period.
   */
  async getTotalExpenses(
    orgId: string,
    params: { startDate?: string; endDate?: string } = {},
  ): Promise<number> {
    // Get expense-type party IDs
    const { data: expenseParties } = await supabase
      .from('parties')
      .select('id')
      .eq('organization_id', orgId)
      .eq('type', 'expense')
      .is('deleted_at', null);

    if (!expenseParties || expenseParties.length === 0) return 0;

    const partyIds = expenseParties.map(p => p.id);

    let query = supabase
      .from('credit_transactions')
      .select('amount')
      .eq('organization_id', orgId)
      .in('party_id', partyIds);

    if (params.startDate) query = query.gte('date', params.startDate);
    if (params.endDate) query = query.lte('date', params.endDate);

    const { data, error } = await query;

    if (error) {
      logger.error('[Expenses] Failed to aggregate expenses', error);
      return 0;
    }

    return (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0);
  },
};
