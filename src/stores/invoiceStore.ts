import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Party } from '../types/domain';

export type InvoiceLineItem = {
  id: string;
  product: Product;
  quantity: number;
  rate: number;
  taxRate: number; // Stored per item at time of sale
  taxAmount: number;
  total: number;
};

interface InvoiceState {
  lineItems: InvoiceLineItem[];
  selectedClient: Party | null;
  invoiceDate: string; // Stored as ISO string
  mode: 'sale' | 'purchase' | null; // Track the mode to prevent cross-contamination

  // Computed values can be derived in components or selectors,
  // but we won't store them constantly to avoid sync issues.

  // Actions
  addItem: (product: Product) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  removeLineItem: (itemId: string) => void;
  setClient: (client: Party | null) => void;
  setInvoiceDate: (date: Date) => void;
  setMode: (mode: 'sale' | 'purchase' | null) => void;
  resetInvoice: () => void;
  loadInvoiceData: (
    invoice: {
      id: string;
      party_id: string | null;
      created_at: string;
      invoice_items: Array<{
        id: string;
        description: string;
        quantity: number;
        unit_price: number;
        amount: number;
        gst_rate?: number | null;
        product_id?: string | null;
      }>;
    },
    party: Party | null,
    products: Product[],
  ) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      lineItems: [],
      selectedClient: null,
      invoiceDate: new Date().toISOString(),
      mode: null,

      addItem: (product: Product) => {
        set(state => {
          const existingItem = state.lineItems.find(
            i => i.product.id === product.id,
          );

          if (existingItem) {
            const nextQty = existingItem.quantity + 1;
            const basis = existingItem.product.price_basis || 'PER_INVENTORY_UNIT';
            const baseQty = existingItem.product.base_quantity || 1;
            
            let itemSubtotal = 0;
            if (basis === 'PER_INVOICE_UNIT') {
              itemSubtotal = (nextQty / baseQty) * existingItem.rate;
            } else {
              itemSubtotal = nextQty * existingItem.rate;
            }

            const newTaxAmount = (itemSubtotal * existingItem.taxRate) / 100;
            
            return {
              lineItems: state.lineItems.map(i => {
                if (i.product.id === product.id) {
                  return {
                    ...i,
                    quantity: nextQty,
                    taxAmount: newTaxAmount,
                    total: itemSubtotal + newTaxAmount,
                  };
                }
                return i;
              }),
            };
          }

          const taxRate = product.tax_rate ?? 18;
          const basis = product.price_basis || 'PER_INVENTORY_UNIT';
          const baseQty = product.base_quantity || 1;
          
          let itemSubtotal = 0;
          if (basis === 'PER_INVOICE_UNIT') {
            itemSubtotal = (1 / baseQty) * product.selling_price;
          } else {
            itemSubtotal = product.selling_price;
          }

          const taxAmount = (itemSubtotal * taxRate) / 100;

          const newItem: InvoiceLineItem = {
            id: Math.random().toString(36).substring(7),
            product,
            quantity: 1,
            rate: product.selling_price,
            taxRate,
            taxAmount,
            total: itemSubtotal + taxAmount,
          };

          return { lineItems: [...state.lineItems, newItem] };
        });
      },

      updateQuantity: (itemId, newQty) => {
        set(state => {
          if (newQty <= 0) {
            return {
              lineItems: state.lineItems.filter(i => i.id !== itemId),
            };
          }
          return {
            lineItems: state.lineItems.map(item => {
              if (item.id === itemId) {
                const basis = item.product.price_basis || 'PER_INVENTORY_UNIT';
                const baseQty = item.product.base_quantity || 1;

                let itemSubtotal = 0;
                if (basis === 'PER_INVOICE_UNIT') {
                  itemSubtotal = (newQty / baseQty) * item.rate;
                } else {
                  itemSubtotal = newQty * item.rate;
                }

                const newTaxAmount = (itemSubtotal * item.taxRate) / 100;
                return {
                  ...item,
                  quantity: newQty,
                  taxAmount: newTaxAmount,
                  total: itemSubtotal + newTaxAmount,
                };
              }
              return item;
            }),
          };
        });
      },

      removeLineItem: itemId => {
        set(state => ({
          lineItems: state.lineItems.filter(i => i.id !== itemId),
        }));
      },

      setClient: client => {
        set({ selectedClient: client });
      },

      setInvoiceDate: (date: Date) => {
        set({ invoiceDate: date.toISOString() });
      },

      setMode: (mode: 'sale' | 'purchase' | null) => {
        set({ mode });
      },

      resetInvoice: () => {
        set({
          lineItems: [],
          selectedClient: null,
          invoiceDate: new Date().toISOString(),
          mode: null,
        });
      },

      loadInvoiceData: (invoice, party, products) => {
        // Map invoice items to line items
        const mappedLineItems: InvoiceLineItem[] = invoice.invoice_items
          .map(item => {
            // Try to find product by product_id first, then by name
            let product: Product | undefined;
            if (item.product_id) {
              product = products.find(p => p.id === item.product_id);
            }
            if (!product) {
              product = products.find(
                p => p.name.toLowerCase() === item.description.toLowerCase(),
              );
            }
            // If product not found, create a minimal product object
            if (!product) {
              product = {
                id: item.product_id || `temp-${item.id}`,
                organization_id: party?.organization_id || '',
                name: item.description,
                sku: '',
                category_id: null,
                selling_price: item.unit_price,
                purchase_price: 0,
                mrp: item.unit_price,
                stock_quantity: 0,
                unit: 'pcs',
                is_active: true,
                tax_rate: item.gst_rate || 18,
              };
            }

            const taxRate = item.gst_rate || product.tax_rate || 18;
            const taxAmount = item.amount - item.unit_price * item.quantity;
            const total = item.amount;

            return {
              id: item.id,
              product,
              quantity: item.quantity,
              rate: item.unit_price,
              taxRate,
              taxAmount: taxAmount >= 0 ? taxAmount : 0,
              total,
            };
          })
          .filter(item => item !== null) as InvoiceLineItem[];

        set({
          lineItems: mappedLineItems,
          selectedClient: party,
          invoiceDate: invoice.created_at,
          mode: 'sale',
        });
      },
    }),
    {
      name: 'invoice-draft-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
