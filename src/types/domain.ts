// ── Domain Types ────────────────────────────────────────────────────────
// Clean, UI-facing interfaces used throughout the app.
// These map to Supabase table rows but with cleaner naming.

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  owner_id: string;
  logo_url: string | null;
  business_type: string | null;
  business_address: string | null;
  gst_number: string | null;
  pan_number: string | null;
  business_phone: string | null;
  whatsapp_number: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  display_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  full_name: string | null;
  is_active: boolean;
}

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  name_secondary?: string | null;
  sku: string | null;
  hsn?: string | null;
  barcode?: string;
  unit: string; // Legacy field, keeping for compatibility
  inventory_unit?: string | null;
  invoice_unit?: string | null;
  price_basis?: 'PER_INVENTORY_UNIT' | 'PER_INVOICE_UNIT' | null;
  base_quantity?: number | null; // e.g., 500 for a 500ml bottle
  selling_price: number;
  purchase_price: number;
  mrp: number;
  stock_quantity: number;
  tax_rate: number;
  category_id?: string | null;
  category?: Category | null;
  image_url?: string | null;
  images?: any[];
  description?: string | null;
  is_active: boolean;
  is_inventory_tracked?: boolean;
  has_variants?: boolean;
  low_stock_threshold?: number;
  deleted_at?: string | null;
  expiry_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  icon: string | null;
  is_active: boolean;
  gst_rate: number | null;
  cgst_rate: number | null;
  sgst_rate: number | null;
  igst_rate: number | null;
  parent_id: string | null;
  created_at?: string;
}

export interface Party {
  id: string;
  organization_id: string;
  name: string;
  type: 'CUSTOMER' | 'VENDOR' | 'expense' | string;
  party_type?: string | null;
  email: string | null;
  phone: string | null;
  mobile?: string | null;
  address: string | null;
  notes: string | null;
  gst_number?: string | null;
  balance?: number;
  billing_address?: any;
  shipping_address?: any;
  wallet_balance?: number;
  credit_limit?: number;
  credit_limit_enabled?: boolean;
  deleted_at?: string | null;
  due_date?: string | null;
  display_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  organization_id: string;
  invoice_number: string;
  invoice_sequence?: number | null;
  invoice_type?: string;
  payment_status: 'PENDING' | 'PARTIAL' | 'PAID' | string;
  payment_method?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  total_tax?: number;
  total_discount?: number;
  received_amount?: number;
  change_amount?: number;
  notes?: string | null;
  party_id?: string | null;
  customer_id?: string | null;
  party?: { name: string } | null;
  is_cancelled?: boolean;
  tax_details?: any;
  origin?: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  organization_id: string;
  product_id: string | null;
  product_name: string;
  name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  subtotal?: number;
  tax_amount?: number;
  tax_rate?: number;
  hsn?: string | null;
  gst_rate?: number;
  gst_amount?: number;
  discount_amount?: number;
  mrp?: number;
  batch_id?: string | null;
  is_returned?: boolean;
  created_at?: string;
}

export interface Batch {
  id: string;
  organization_id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  purchase_price: number;
  selling_price: number | null;
  mrp: number | null;
  mfg_date: string | null;
  expiry_date: string | null;
  is_active: boolean;
}

export interface StockLedgerEntry {
  id: string;
  organization_id: string;
  product_id: string;
  batch_id: string | null;
  quantity_change: number;
  movement_type: string; // 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' etc.
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  organization_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  data: any;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  organization_id: string;
  party_id: string;
  type: 'received' | 'given';
  amount: number;
  date: string;
  description: string | null;
  reference_number: string | null;
  order_id: string | null;
  reminder_sent?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Legacy Aliases (for gradual migration) ──────────────────────────────
// These help screens that still reference Invoice types to compile.
// TODO: Remove once all screens are converted to use Order/OrderItem.
/** @deprecated Use Order instead */
export type Invoice = Order;
/** @deprecated Use OrderItem instead */
export type InvoiceItem = OrderItem;
