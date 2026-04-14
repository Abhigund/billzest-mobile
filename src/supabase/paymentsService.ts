import { supabase } from './supabaseClient';
import { Database } from '../database.types';
import { toAppError, AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];

export type CreatePaymentInput = {
  organization_id: string;
  reference_type: string; // 'order' | 'purchase_order' | 'credit_transaction'
  reference_id: string;
  amount: number;
  method?: string;
  payment_method?: string;
  payment_flow?: 'IN' | 'OUT';
  status?: string;
  order_id?: string;
  metadata?: any;
};

export const paymentsService = {
  /**
   * List payments for a specific order.
   */
  async listPaymentsForOrder(
    orgId: string,
    orderId: string,
  ): Promise<PaymentRow[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[Payments] Failed to fetch payments for order', error);
      throw toAppError('payments.list', error, 'Unable to load payments.');
    }

    return (data ?? []) as PaymentRow[];
  },

  /**
   * List payments by reference (generic).
   */
  async listPaymentsByReference(
    orgId: string,
    referenceType: string,
    referenceId: string,
  ): Promise<PaymentRow[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[Payments] Failed to fetch payments by reference', error);
      throw toAppError('payments.listRef', error, 'Unable to load payments.');
    }

    return (data ?? []) as PaymentRow[];
  },

  /**
   * Create a payment record.
   */
  async createPayment(input: CreatePaymentInput): Promise<PaymentRow> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    const payload: PaymentInsert = {
      organization_id: input.organization_id,
      reference_type: input.reference_type ?? 'order',
      reference_id: input.reference_id,
      amount: input.amount,
      method: input.method ?? null,
      payment_method: input.payment_method ?? null,
      payment_flow: input.payment_flow ?? 'IN',
      status: input.status ?? 'completed',
      order_id: input.order_id ?? null,
      metadata: input.metadata ?? {},
      created_by: user?.id ?? null,
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw toAppError('payments.create', error, 'Unable to record payment.');
    }

    return data as PaymentRow;
  },
};
