import { supabase } from "./supabaseClient";
import type { Order, OrderItem, Party } from "../types/domain";
import { AppError, toAppError } from "../utils/appError";
import { logger } from "../utils/logger";
import { partyBalanceService } from "./partyBalanceService";

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
  party?: Party | null;
};

export type CreateOrderPayload = {
  order: Omit<
    Order,
    "id" | "organization_id" | "items" | "party" | "created_at" | "updated_at"
  >;
  items: Array<
    Pick<
      OrderItem,
      "product_id" | "product_name" | "quantity" | "unit_price" | "total_price"
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
  order: Partial<Omit<Order, "id" | "organization_id" | "items" | "party">>;
  items?: CreateOrderPayload["items"];
};

// ── Service ─────────────────────────────────────────────────────────────

export const ordersService = {
  /**
   * List orders with optional search and status filter.
   */
  async listOrders(
    orgId: string,
    params: {
      search?: string;
      status?: string;
      from?: number;
      to?: number;
    } = {},
  ): Promise<OrderWithParty[]> {
    const { search, status, from, to } = params;

    let query = supabase
      .from("orders")
      .select("*, parties!orders_party_id_fkey(name, phone, email)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (status && status !== "All") {
      query = query.eq("status", status.toLowerCase());
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(
        `invoice_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`,
      );
    }

    if (typeof from === "number" && typeof to === "number") {
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("[Orders] Failed to fetch", error);
      throw toAppError("orders.list", error, "Unable to load orders.");
    }

    return (data ?? []) as OrderWithParty[];
  },

  /**
   * Get a single order with its items.
   */
  async getOrderById(id: string): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), party:parties!orders_party_id_fkey(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      logger.error("[Orders] Failed to fetch order detail", error);
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

    if (!user) throw new Error("User not authenticated");

    const { order, items, productIds } = payload;

    // 1. Insert the order
    const { data: insertedOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        ...order,
        organization_id: orgId,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (orderError) {
      throw toAppError("orders.create", orderError, "Unable to create order.");
    }

    const orderId = insertedOrder.id;

    // 2. Insert order items
    if (items.length > 0) {
      const orderItems = items.map((item) => ({
        ...item,
        order_id: orderId,
        organization_id: orgId,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        logger.error(
          "[Orders] Failed to create order items, deleting orphaned header",
          itemsError,
        );
        // Manually delete the orphaned order header
        await supabase.from("orders").delete().eq("id", orderId);

        throw toAppError(
          "orders.create.items",
          itemsError,
          "Failed to add items, order header deleted to prevent corruption.",
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
          .from("products")
          .select("id, stock_quantity")
          .in("id", pIds);

        for (const prod of prods ?? []) {
          const decrease = productQuantities.get(prod.id as string) ?? 0;
          const currentStock = (prod.stock_quantity as number) ?? 0;
          await supabase
            .from("products")
            .update({ stock_quantity: Math.max(0, currentStock - decrease) })
            .eq("id", prod.id);
        }

        // 4. Create stock_ledger entries
        const ledgerEntries = Array.from(productQuantities.entries()).map(
          ([productId, qty]) => ({
            organization_id: orgId,
            product_id: productId,
            quantity_change: -qty,
            movement_type: "SALE",
            reference_id: orderId,
            notes: `Order #${order.invoice_number}`,
            created_by: user.id,
          }),
        );

        await supabase.from("stock_ledger").insert(ledgerEntries);
      }
    } catch (stockErr) {
      logger.error("[Orders] Stock adjustment failed", stockErr);
    }

    // 4.5. Update party balance ledger if there is an unpaid amount
    try {
      const partyId = order.party_id ?? order.customer_id;
      const totalAmount = order.total_amount ?? 0;
      const receivedAmount = order.received_amount ?? 0;
      const unpaidAmount = totalAmount - receivedAmount;

      if (partyId && unpaidAmount > 0) {
        await partyBalanceService.recordCreditTransaction(orgId, {
          party_id: partyId,
          amount: unpaidAmount,
          type: "given",
          description: `Unpaid invoice amount for Order #${order.invoice_number}`,
          reference_number: orderId,
        });
      }
    } catch (ledgerErr) {
      logger.error("[Orders] Party ledger update failed", ledgerErr);
    }

    // 5. Return the created order with items
    const withItems = await this.getOrderById(orderId);
    if (!withItems) {
      throw new AppError("server", "Order created but cannot fetch details.");
    }
    return withItems;
  },

  /**
   * Update order fields (status, dates, notes).
   */
  async updateOrder(
    id: string,
    updates: Partial<Omit<Order, "id" | "organization_id" | "items" | "party">>,
    itemsPayload?: CreateOrderPayload["items"],
  ): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw toAppError("orders.update", error, "Unable to update order.");
    }

    if (itemsPayload) {
      const orgId = data.organization_id;
      // Delete existing items
      await supabase.from("order_items").delete().eq("order_id", id);
      // Insert new items
      const orderItems = itemsPayload.map((item) => ({
        ...item,
        order_id: id,
        organization_id: orgId,
      }));
      await supabase.from("order_items").insert(orderItems);
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
      throw new AppError("server", "Order not found.");
    }

    // 2. Mark as cancelled
    const { data, error } = await supabase
      .from("orders")
      .update({
        is_cancelled: true,
        status: "cancelled",
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw toAppError("orders.cancel", error, "Unable to cancel order.");
    }

    // 3. Restore stock
    try {
      for (const item of orderWithItems.order_items) {
        if (!item.product_id || !item.quantity || item.is_returned) continue;

        const { data: prod } = await supabase
          .from("products")
          .select("id, stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (prod) {
          const currentStock = (prod.stock_quantity as number) ?? 0;
          await supabase
            .from("products")
            .update({ stock_quantity: currentStock + item.quantity })
            .eq("id", prod.id);
        }
      }

      // Create reversal ledger entries
      const reversals = orderWithItems.order_items
        .filter((item) => item.product_id && item.quantity)
        .map((item) => ({
          organization_id: orgId,
          product_id: item.product_id!,
          quantity_change: item.quantity,
          movement_type: "CANCELLATION",
          reference_id: id,
          notes: `Cancellation of Order #${orderWithItems.invoice_number}`,
          created_by: user?.id ?? null,
        }));

      if (reversals.length > 0) {
        await supabase.from("stock_ledger").insert(reversals);
      }
    } catch (stockErr) {
      logger.error(
        "[Orders] Stock restoration failed after cancellation",
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
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", id);
    if (itemsError) {
      throw toAppError(
        "orders.delete.items",
        itemsError,
        "Unable to delete order items.",
      );
    }

    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      throw toAppError("orders.delete", error, "Unable to delete order.");
    }
  },
};
