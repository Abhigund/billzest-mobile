import { OrderWithItems } from '../supabase/ordersService';
import { PurchaseOrder } from '../supabase/purchasesService';
import { billConfigService } from '../supabase/billConfigService';
import { Share, Platform } from 'react-native';
import { logger } from '../utils/logger';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

export const generateInvoiceHTML = async (
  invoice: OrderWithItems,
  billConfig?: any,
): Promise<string> => {
  const storeName = billConfig?.store_name || 'BillZest Retailers';
  const storeAddress = billConfig?.address || '';
  const storePhone = billConfig?.phone || '';
  const gstNumber = billConfig?.gst_number || '';
  const storeEmail = billConfig?.email || '';

  const partyName = (invoice as any).parties?.name || 'Customer';
  const partyPhone = (invoice as any).parties?.phone || '';
  const partyEmail = (invoice as any).parties?.email || '';

  const invoiceNumber = invoice.invoice_number;
  const issueDate = formatDate(
    (invoice as any).issue_date ||
      invoice.created_at ||
      new Date().toISOString(),
  );
  const dueDate = formatDate(
    (invoice as any).due_date || invoice.created_at || new Date().toISOString(),
  );
  const status = (invoice.payment_status || 'PENDING').toUpperCase();

  const subtotal = invoice.subtotal || 0;
  const taxAmount = invoice.tax_amount || 0;
  const totalAmount = invoice.total_amount || 0;
  const taxRate = (invoice as any).tax_rate || 0;

  const items = invoice.order_items || [];
  const notes = invoice.notes || 'Thank you for your business!';

  const itemsHTML = items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(
        item.description,
      )}</td>
      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${
        item.quantity
      }</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(
        item.unit_price,
      )}</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(
        item.amount,
      )}</td>
    </tr>
  `,
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px; line-height: 1.6; color: #1f2937; background: #ffffff; padding: 40px 20px;
    }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .brand { flex: 1; }
    .brand-name { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px; }
    .brand-meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #f3f4f6; border: 1px solid #e5e7eb; font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .meta-item { padding: 12px; background: #f9fafb; border-radius: 8px; }
    .meta-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .meta-value { font-size: 14px; font-weight: 600; color: #111827; }
    .bill-to { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .bill-to-item { padding: 12px; background: #f9fafb; border-radius: 8px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .items-table thead { background: #f9fafb; }
    .items-table th { padding: 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .items-table th:last-child, .items-table td:last-child { text-align: right; }
    .items-table th:nth-child(2), .items-table td:nth-child(2) { text-align: center; }
    .items-table th:nth-child(3), .items-table td:nth-child(3) { text-align: right; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .items-table tr:last-child td { border-bottom: none; }
    .totals { margin-left: auto; width: 300px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .total-label { color: #6b7280; font-size: 14px; }
    .total-value { color: #111827; font-weight: 600; font-size: 14px; }
    .total-divider { height: 1px; background: #e5e7eb; margin: 12px 0; }
    .total-row-grand { display: flex; justify-content: space-between; margin-top: 8px; }
    .total-label-grand { color: #111827; font-weight: 700; font-size: 18px; }
    .total-value-grand { color: #111827; font-weight: 700; font-size: 18px; }
    .notes { margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .notes-title { font-weight: 600; color: #111827; margin-bottom: 8px; }
    .notes-text { color: #6b7280; font-size: 13px; line-height: 1.6; }
    @media print { body { padding: 0; } .container { max-width: 100%; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-name">${escapeHtml(storeName)}</div>
        ${storeAddress ? `<div class="brand-meta">${escapeHtml(storeAddress)}</div>` : ''}
        ${storePhone ? `<div class="brand-meta">Phone: ${escapeHtml(storePhone)}</div>` : ''}
        ${storeEmail ? `<div class="brand-meta">Email: ${escapeHtml(storeEmail)}</div>` : ''}
        ${gstNumber ? `<div class="brand-meta">GSTIN: ${escapeHtml(gstNumber)}</div>` : ''}
      </div>
      <div class="status-badge">${status}</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Invoice Number</div>
        <div class="meta-value">#${escapeHtml(invoiceNumber)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Issue Date</div>
        <div class="meta-value">${issueDate}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Due Date</div>
        <div class="meta-value">${dueDate}</div>
      </div>
    </div>

    <div class="bill-to">
      <div class="bill-to-item">
        <div class="meta-label">Bill To</div>
        <div class="meta-value" style="margin-top: 8px;">
          ${escapeHtml(partyName)}<br>
          ${partyPhone ? `<span style="color: #6b7280; font-size: 12px;">${escapeHtml(partyPhone)}</span><br>` : ''}
          ${partyEmail ? `<span style="color: #6b7280; font-size: 12px;">${escapeHtml(partyEmail)}</span>` : ''}
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span class="total-label">Subtotal</span>
        <span class="total-value">${formatCurrency(subtotal)}</span>
      </div>
      ${taxAmount > 0 ? `
      <div class="total-row">
        <span class="total-label">GST (${taxRate}%)</span>
        <span class="total-value">${formatCurrency(taxAmount)}</span>
      </div>
      ` : ''}
      <div class="total-divider"></div>
      <div class="total-row-grand">
        <span class="total-label-grand">Grand Total</span>
        <span class="total-value-grand">${formatCurrency(totalAmount)}</span>
      </div>
    </div>

    <div class="notes">
      <div class="notes-title">Notes</div>
      <div class="notes-text">${escapeHtml(notes)}</div>
    </div>
  </div>
</body>
</html>
  `;

  return html;
};

export const pdfService = {
  /**
   * Generate PDF from invoice data using expo-print
   * Returns file URI for sharing
   */
  async generateInvoicePDF(
    invoice: OrderWithItems,
    orgId?: string,
  ): Promise<string> {
    try {
      const billConfig = orgId
        ? await billConfigService.getConfig(orgId)
        : null;

      const html = await generateInvoiceHTML(invoice, billConfig || undefined);

      try {
        const { uri } = await Print.printToFileAsync({
          html,
          width: 595,
          height: 842,
        });

        if (__DEV__) {
          logger.log('[PDF] Generated PDF at:', uri);
        }
        return uri;
      } catch (printError: any) {
        if (__DEV__) {
          logger.warn('[PDF] expo-print not available, falling back to HTML:', printError);
        }
        return html;
      }
    } catch (error) {
      logger.error('[PDF] Failed to generate invoice PDF', error);
      throw error;
    }
  },

  /**
   * Share invoice as PDF file using expo-sharing
   * Falls back to text sharing if sharing is not available
   */
  async shareInvoiceAsPDF(
    invoice: OrderWithItems,
    orgId?: string,
  ): Promise<void> {
    try {
      const fileUri = await this.generateInvoicePDF(invoice, orgId);

      if (fileUri.startsWith('file://') || fileUri.startsWith('/')) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Invoice ${invoice.invoice_number}`,
            UTI: 'com.adobe.pdf',
          });
          return;
        }
      }

      // Fallback: Share as text
      const textVersion = this.generateTextVersion(invoice);
      await Share.share({
        message: textVersion,
        title: `Invoice ${invoice.invoice_number}`,
      });
    } catch (error) {
      logger.error('[PDF] Failed to share invoice', error);
      throw error;
    }
  },

  /**
   * Share invoice as HTML (deprecated, calls shareInvoiceAsPDF)
   * @deprecated Use shareInvoiceAsPDF instead
   */
  async shareInvoiceAsHTML(
    invoice: OrderWithItems,
    orgId?: string,
  ): Promise<void> {
    return this.shareInvoiceAsPDF(invoice, orgId);
  },

  /**
   * Generate and share invoice as formatted text
   */
  async shareInvoiceAsText(invoice: OrderWithItems): Promise<void> {
    try {
      const textVersion = this.generateTextVersion(invoice);
      await Share.share({
        message: textVersion,
        title: `Invoice ${invoice.invoice_number}`,
      });
    } catch (error) {
      logger.error('[PDF] Failed to share invoice', error);
      throw error;
    }
  },

  /**
   * Generate a text version of the invoice for sharing
   */
  generateTextVersion(invoice: OrderWithItems): string {
    const partyName = (invoice as any).parties?.name || 'Customer';
    const items = invoice.order_items || [];

    let text = `INVOICE ${invoice.invoice_number}\n\n`;
    text += `Bill To: ${partyName}\n`;
    text += `Issue Date: ${formatDate(
      (invoice as any).issue_date ||
        invoice.created_at ||
        new Date().toISOString(),
    )}\n`;
    text += `Due Date: ${formatDate(
      (invoice as any).due_date ||
        invoice.created_at ||
        new Date().toISOString(),
    )}\n`;
    text += `Payment Status: ${(invoice.payment_status || 'PENDING').toUpperCase()}\n\n`;
    text += `ITEMS:\n`;
    text += `${'Description'.padEnd(30)} ${'Qty'.padEnd(8)} ${'Rate'.padEnd(12)} ${'Amount'.padEnd(12)}\n`;
    text += `${'-'.repeat(70)}\n`;

    items.forEach((item: any) => {
      text += `${item.description.padEnd(30)} ${String(item.quantity).padEnd(8)} ${formatCurrency(item.unit_price).padEnd(12)} ${formatCurrency(item.amount).padEnd(12)}\n`;
    });

    text += `\nSubtotal: ${formatCurrency(invoice.subtotal || 0)}\n`;
    if (invoice.tax_amount) {
      text += `GST (${(invoice as any).tax_rate || 0}%): ${formatCurrency(invoice.tax_amount)}\n`;
    }
    text += `Grand Total: ${formatCurrency(invoice.total_amount)}\n`;

    if (invoice.notes) {
      text += `\nNotes: ${invoice.notes}\n`;
    }

    return text;
  },

  /**
   * Generate HTML for purchase receipt
   */
  async generatePurchaseReceiptHTML(
    purchase: PurchaseOrder,
    billConfig?: any,
  ): Promise<string> {
    const storeName = billConfig?.store_name || 'BillZest Retailers';
    const storeAddress = billConfig?.address || '';
    const storePhone = billConfig?.phone || '';
    const gstNumber = billConfig?.gst_number || '';
    const storeEmail = billConfig?.email || '';

    const vendorName = purchase.vendor_name || 'Vendor';
    const vendorPhone = purchase.vendor_phone || '';

    const orderNumber = purchase.order_number;
    const orderDate = formatDate(purchase.order_date);
    const status = (purchase.payment_status || 'PAID').toUpperCase();

    const totalAmount = purchase.total_amount || 0;
    const totalQuantity = purchase.total_quantity || 0;

    const items = purchase.purchase_order_items || [];
    const notes = purchase.notes || 'Thank you for your business!';

    const itemsHTML = items
      .map(
        item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.product_name)}</td>
      ${item.sku ? `<td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.sku)}</td>` : '<td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">-</td>'}
      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.total_price)}</td>
    </tr>
  `,
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Receipt ${orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1f2937; background: #ffffff; padding: 40px 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .brand { flex: 1; }
    .brand-name { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px; }
    .brand-meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #f3f4f6; border: 1px solid #e5e7eb; font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .meta-item { padding: 12px; background: #f9fafb; border-radius: 8px; }
    .meta-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .meta-value { font-size: 14px; font-weight: 600; color: #111827; }
    .vendor-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .vendor-item { padding: 12px; background: #f9fafb; border-radius: 8px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .items-table thead { background: #f9fafb; }
    .items-table th { padding: 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .items-table th:last-child, .items-table td:last-child { text-align: right; }
    .items-table th:nth-child(3), .items-table td:nth-child(3), .items-table th:nth-child(4), .items-table td:nth-child(4), .items-table th:nth-child(5), .items-table td:nth-child(5) { text-align: right; }
    .items-table th:nth-child(2), .items-table td:nth-child(2) { text-align: center; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .items-table tr:last-child td { border-bottom: none; }
    .totals { margin-left: auto; width: 300px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .total-label { color: #6b7280; font-size: 14px; }
    .total-value { color: #111827; font-weight: 600; font-size: 14px; }
    .total-divider { height: 1px; background: #e5e7eb; margin: 12px 0; }
    .total-row-grand { display: flex; justify-content: space-between; margin-top: 8px; }
    .total-label-grand { color: #111827; font-weight: 700; font-size: 18px; }
    .total-value-grand { color: #111827; font-weight: 700; font-size: 18px; }
    .notes { margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #059669; }
    .notes-title { font-weight: 600; color: #111827; margin-bottom: 8px; }
    .notes-text { color: #6b7280; font-size: 13px; line-height: 1.6; }
    @media print { body { padding: 0; } .container { max-width: 100%; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-name">${escapeHtml(storeName)}</div>
        ${storeAddress ? `<div class="brand-meta">${escapeHtml(storeAddress)}</div>` : ''}
        ${storePhone ? `<div class="brand-meta">Phone: ${escapeHtml(storePhone)}</div>` : ''}
        ${storeEmail ? `<div class="brand-meta">Email: ${escapeHtml(storeEmail)}</div>` : ''}
        ${gstNumber ? `<div class="brand-meta">GSTIN: ${escapeHtml(gstNumber)}</div>` : ''}
      </div>
      <div class="status-badge">${status}</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Purchase Order Number</div>
        <div class="meta-value">#${escapeHtml(orderNumber)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Order Date</div>
        <div class="meta-value">${orderDate}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Total Quantity</div>
        <div class="meta-value">${totalQuantity}</div>
      </div>
    </div>

    <div class="vendor-info">
      <div class="vendor-item">
        <div class="meta-label">Vendor</div>
        <div class="meta-value" style="margin-top: 8px;">
          ${escapeHtml(vendorName)}<br>
          ${vendorPhone ? `<span style="color: #6b7280; font-size: 12px;">${escapeHtml(vendorPhone)}</span>` : ''}
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Product Name</th>
          <th>SKU</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span class="total-label">Total Quantity</span>
        <span class="total-value">${totalQuantity}</span>
      </div>
      <div class="total-divider"></div>
      <div class="total-row-grand">
        <span class="total-label-grand">Grand Total</span>
        <span class="total-value-grand">${formatCurrency(totalAmount)}</span>
      </div>
    </div>

    <div class="notes">
      <div class="notes-title">Notes</div>
      <div class="notes-text">${escapeHtml(notes)}</div>
    </div>
  </div>
</body>
</html>
  `;

    return html;
  },

  /**
   * Generate PDF from purchase order data using expo-print
   */
  async generatePurchaseReceiptPDF(
    purchase: PurchaseOrder,
    orgId?: string,
  ): Promise<string> {
    try {
      const billConfig = orgId
        ? await billConfigService.getConfig(orgId)
        : null;
      const html = await this.generatePurchaseReceiptHTML(
        purchase,
        billConfig || undefined,
      );

      try {
        const { uri } = await Print.printToFileAsync({
          html,
          width: 595,
          height: 842,
        });

        if (__DEV__) {
          logger.log('[PDF] Generated purchase receipt PDF at:', uri);
        }
        return uri;
      } catch (pdfError: any) {
        if (__DEV__) {
          logger.warn('[PDF] expo-print not available, falling back to HTML:', pdfError);
        }
        return html;
      }
    } catch (error) {
      logger.error('[PDF] Failed to generate purchase receipt PDF', error);
      throw error;
    }
  },

  /**
   * Share purchase receipt as PDF file using expo-sharing
   */
  async sharePurchaseReceiptAsPDF(
    purchase: PurchaseOrder,
    orgId?: string,
  ): Promise<void> {
    try {
      const fileUri = await this.generatePurchaseReceiptPDF(purchase, orgId);

      if (fileUri.startsWith('file://') || fileUri.startsWith('/')) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Purchase Receipt ${purchase.order_number}`,
            UTI: 'com.adobe.pdf',
          });
          return;
        }
      }

      // Fallback: Share as text
      const textVersion = this.generatePurchaseReceiptTextVersion(purchase);
      await Share.share({
        message: textVersion,
        title: `Purchase Receipt ${purchase.order_number}`,
      });
    } catch (error) {
      logger.error('[PDF] Failed to share purchase receipt', error);
      throw error;
    }
  },

  /**
   * Download purchase receipt PDF
   */
  async downloadPurchaseReceiptPDF(purchase: PurchaseOrder): Promise<string> {
    try {
      const filePath = await this.generatePurchaseReceiptPDF(purchase);
      if (__DEV__) {
        logger.log('[PDF] Purchase receipt downloaded to:', filePath);
      }
      return filePath;
    } catch (error) {
      logger.error('[PDF] Failed to download purchase receipt', error);
      throw error;
    }
  },

  /**
   * Generate text version of purchase receipt
   */
  generatePurchaseReceiptTextVersion(purchase: PurchaseOrder): string {
    const vendorName = purchase.vendor_name || 'Vendor';
    const items = purchase.purchase_order_items || [];

    let text = `PURCHASE RECEIPT ${purchase.order_number}\n\n`;
    text += `Vendor: ${vendorName}\n`;
    if (purchase.vendor_phone) {
      text += `Phone: ${purchase.vendor_phone}\n`;
    }
    text += `Order Date: ${formatDate(purchase.order_date)}\n`;
    text += `Payment Status: ${(purchase.payment_status || 'PAID').toUpperCase()}\n\n`;
    text += `ITEMS:\n`;
    text += `${'Product Name'.padEnd(30)} ${'SKU'.padEnd(15)} ${'Qty'.padEnd(8)} ${'Rate'.padEnd(12)} ${'Amount'.padEnd(12)}\n`;
    text += `${'-'.repeat(85)}\n`;

    items.forEach(item => {
      text += `${(item.product_name || '').padEnd(30)} ${(item.sku || '-').padEnd(15)} ${String(item.quantity).padEnd(8)} ${formatCurrency(item.unit_price).padEnd(12)} ${formatCurrency(item.total_price).padEnd(12)}\n`;
    });

    text += `\nTotal Quantity: ${purchase.total_quantity || 0}\n`;
    text += `Grand Total: ${formatCurrency(purchase.total_amount)}\n`;

    if (purchase.notes) {
      text += `\nNotes: ${purchase.notes}\n`;
    }

    return text;
  },
};
