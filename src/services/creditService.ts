import { supabase } from "../supabase/supabaseClient";
import { ordersService, CreateOrderPayload } from "../supabase/ordersService";
import { paymentsService } from "../supabase/paymentsService";

// Synthetic type representing a unified transaction
export type CreditTransaction = {
  id: string;
  party_id: string;
  amount: number;
  type: "received" | "given";
  description: string | null;
  date: string;
  created_at: string;
  reference_id: string; // order_id or payment_id
};

export type CreateCreditTransactionDTO = {
  organization_id: string;
  party_id: string;
  amount: number;
  type: "received" | "given";
  description?: string | null;
  date?: string;
  payment_method?: string; // Optional: payment method for 'received' type
  reference_number?: string | null; // Optional: reference number for payment
};

export const creditService = {
  // Fetch transactions for a specific party
  async getTransactions(
    orgId: string,
    partyId: string,
  ): Promise<CreditTransaction[]> {
    // 1. Fetch Orders (Credit Given)
    const { data: orders, error: ordError } = await supabase
      .from("orders")
      .select("id, total_amount, created_at, notes, invoice_number")
      .eq("organization_id", orgId)
      .eq("party_id", partyId)
      .eq("is_cancelled", false);

    if (ordError) throw ordError;

    // 2. Fetch Payments (Credit Received) - Joined via Orders
    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select(
        "id, amount, payment_date, notes, created_at, order_id, orders!inner(party_id)",
      )
      .eq("organization_id", orgId)
      .eq("orders.party_id", partyId);

    if (payError) throw payError;

    // 3. Map to unified format
    const orderTxns: CreditTransaction[] = (orders || []).map((ord) => ({
      id: ord.id,
      party_id: partyId,
      amount: ord.total_amount,
      type: "given",
      description: ord.notes || `Order #${ord.invoice_number}`,
      date: ord.created_at,
      created_at: ord.created_at || new Date().toISOString(),
      reference_id: ord.id,
    }));

    const paymentTxns: CreditTransaction[] = (payments || []).map((pay) => ({
      id: pay.id,
      party_id: partyId,
      amount: pay.amount,
      type: "received",
      description: pay.notes || "Payment Received",
      date: pay.payment_date,
      created_at: pay.created_at || new Date().toISOString(),
      reference_id: pay.id,
    }));

    // 4. Merge and Sort
    const allTxns = [...orderTxns, ...paymentTxns].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return allTxns;
  },

  // Add a new manual transaction
  async addTransaction(transaction: CreateCreditTransactionDTO) {
    const {
      organization_id,
      party_id,
      amount,
      type,
      description,
      date,
      payment_method,
      reference_number,
    } = transaction;
    const txnDate = date || new Date().toISOString();

    if (type === "given") {
      // Create Order
      const payload: CreateOrderPayload = {
        order: {
          party_id,
          status: "delivered",
          total_amount: amount,
          notes: description || "Manual Credit Entry",
          invoice_number: `MANUAL-${Date.now()}`,
          payment_status: "unpaid",
          // @ts-ignore: passing created_at for backdated manual entry
          created_at: txnDate,
        },
        items: [
          {
            product_name: description || "Credit Given",
            quantity: 1,
            unit_price: amount,
            total_price: amount,
            product_id: null,
          },
        ],
      };
      return ordersService.createOrder(organization_id, payload);
    } else {
      // Create Payment (Auto-allocation)
      // 1. Fetch unpaid orders
      const { data: unpaidOrders, error } = await supabase
        .from("orders")
        .select("id, total_amount, created_at")
        .eq("organization_id", organization_id)
        .eq("party_id", party_id)
        .neq("payment_status", "paid")
        .eq("is_cancelled", false)
        .order("created_at", { ascending: true }); // Pay oldest first

      if (error) throw error;

      // 2. Fetch existing payments for these orders to calculate "remaining to pay" per order
      let remainingAmount = amount;
      const paymentsMade = [];

      for (const order of unpaidOrders || []) {
        if (remainingAmount <= 0) break;

        // Calculate outstanding for this order
        const orderPayments = await paymentsService.listPaymentsForOrder(
          organization_id,
          order.id,
        );
        const paidSoFar = orderPayments.reduce(
          (sum: number, p: any) => sum + p.amount,
          0,
        );
        const outstanding = order.total_amount - paidSoFar;

        if (outstanding <= 0) continue;

        const payAmount = Math.min(remainingAmount, outstanding);

        // Record Payment
        const paymentNotes =
          description ||
          (reference_number
            ? `Payment - Ref: ${reference_number}`
            : "Manual Payment");

        const payment = await paymentsService.createPayment({
          organization_id,
          order_id: order.id,
          reference_type: "order",
          reference_id: order.id,
          amount: payAmount,
          payment_method: payment_method || "cash",
          payment_flow: "IN",
          metadata: {
            payment_date: txnDate,
            reference_number: reference_number || null,
            notes: paymentNotes,
          },
        });

        paymentsMade.push(payment);
        remainingAmount -= payAmount;

        // Update Order Status if fully paid
        if (payAmount >= outstanding) {
          await ordersService.updateOrder(order.id, {
            payment_status: "paid",
          });
        } else {
          await ordersService.updateOrder(order.id, {
            payment_status: "partial",
          });
        }
      }

      if (remainingAmount > 0) {
        throw new Error(
          `Payment of ₹${amount} exceeds total outstanding debt. Excess amount: ₹${remainingAmount}. Please create an order for the excess amount first.`,
        );
      }

      return paymentsMade;
    }
  },
};
