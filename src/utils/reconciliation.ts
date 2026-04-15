import { Order, OrderItem } from '../types/domain';
import { DataMismatchException } from './appError';
import { logger } from './logger';

export interface ReconciliationResult {
  isValid: boolean;
  expectedTotal: number;
  actualTotal: number;
  difference: number;
  details: {
    itemSum: number;
    taxSum: number;
    discountSum: number;
  };
}

/**
 * Validates the arithmetic integrity of an order.
 * sum(item_subtotals) + sum(item_taxes) - sum(item_discounts) == grand_total
 */
export const validateInvoiceIntegrity = (order: Order): ReconciliationResult => {
  const items = order.items || [];
  
  const itemSum = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const taxSum = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const discountSum = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
  
  const expectedTotal = itemSum + taxSum - discountSum;
  const actualTotal = order.total_amount;
  const difference = Math.abs(expectedTotal - actualTotal);

  // Use a small epsilon for floating point comparison (0.01 for currency)
  const isValid = difference < 0.01;

  if (!isValid) {
    const errorDetails = {
      orderId: order.id,
      invoiceNumber: order.invoice_number,
      expectedTotal,
      actualTotal,
      difference,
      details: { itemSum, taxSum, discountSum }
    };

    logger.error('CRITICAL: Invoice Data Mismatch Detected', null, errorDetails);
    
    // We don't throw immediately, we return the result so the UI can decide
  }

  return {
    isValid,
    expectedTotal,
    actualTotal,
    difference,
    details: { itemSum, taxSum, discountSum }
  };
};

/**
 * Repairs an order's totals based on its line items.
 * This is used when the stored totals in the Order header have diverged from the Items.
 */
export const calculateRepairedTotals = (items: OrderItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const tax_amount = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const total_discount = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
  const total_amount = subtotal + tax_amount - total_discount;

  return {
    subtotal,
    tax_amount,
    total_amount,
    total_tax: tax_amount,
    total_discount
  };
};
