import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInvoiceStore } from '../../../stores/invoiceStore';
import { useCreateOrder, useUpdateOrder, useUpdateOrderStatus } from '../../../logic/orderLogic';
import { useCreatePurchase } from '../../../logic/purchaseLogic';
import { useOrganization } from '../../../contexts/OrganizationContext';
import {
  generateInvoiceNumber,
  generatePurchaseOrderNumber,
} from '../../../utils/invoiceNumberGenerator';

export interface UseInvoiceFlowProps {
  finalTotal: number;
  subtotal: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  amountReceived: number;
  discountAmt: number;
  products: any[];
  setScannerVisible: (visible: boolean) => void;
  existingInvoice?: any;
}

export const useInvoiceFlow = ({
  finalTotal,
  subtotal,
  taxAmount,
  cgst,
  sgst,
  amountReceived,
  discountAmt,
  products,
  setScannerVisible,
  existingInvoice,
}: UseInvoiceFlowProps) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { organizationId } = useOrganization();
  
  const createInvoice = useCreateOrder();
  const updateInvoice = useUpdateOrder();
  const createPurchase = useCreatePurchase();

  const invoiceId = route.params?.invoiceId as string | undefined;
  const isEditMode = !!invoiceId;

  const {
    selectedClient,
    lineItems,
    invoiceDate,
    mode,
    addItem,
    resetInvoice,
    setMode,
  } = useInvoiceStore();

  const isSubmitting = createInvoice.isPending || updateInvoice.isPending || createPurchase.isPending;

  const validate = (): { isValid: boolean; error?: string } => {
    if (!selectedClient) {
      return {
        isValid: false,
        error:
          mode === "sale"
            ? "Please select a customer before saving the invoice."
            : "Please select a vendor or supplier before saving the purchase.",
      };
    }
    if (lineItems.length === 0) {
      return {
        isValid: false,
        error:
          mode === "sale"
            ? "Add at least one item to create an invoice."
            : "Add at least one item to record a purchase.",
      };
    }
    for (const item of lineItems) {
      if (item.quantity <= 0) {
        return {
          isValid: false,
          error: `Quantity for "${item.product.name}" must be greater than zero.`,
        };
      }
      if (item.rate <= 0) {
        return {
          isValid: false,
          error: `Price for "${item.product.name}" must be greater than zero.`,
        };
      }
      if (!Number.isInteger(item.quantity)) {
        return {
          isValid: false,
          error: `Quantity for "${item.product.name}" must be a whole number.`,
        };
      }
      if (mode === "sale" && item.product.stock_quantity !== undefined) {
        const availableStock = item.product.stock_quantity ?? 0;
        let originalQuantity = 0;
        if (isEditMode && existingInvoice) {
          const originalItem = existingInvoice.items?.find(
            (invItem: any) =>
              invItem.product_name === item.product.name ||
              invItem.product_id === item.product.id,
          );
          if (originalItem) {
            originalQuantity = originalItem.quantity;
          }
        }
        const effectiveAvailableStock = availableStock + originalQuantity;
        if (item.quantity > effectiveAvailableStock) {
          return {
            isValid: false,
            error: `Insufficient stock for "${item.product.name}". Available: ${effectiveAvailableStock}, Requested: ${item.quantity}`,
          };
        }
      }
    }
    const issueDate = new Date(invoiceDate);
    if (isNaN(issueDate.getTime())) {
      return { isValid: false, error: "Please select a valid date." };
    }
    return { isValid: true };
  };

  const handleBack = () => {
    if (lineItems.length > 0) {
      Alert.alert("Park Sale?", "Your changes will be saved as a draft.", [
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            resetInvoice();
            navigation.goBack();
          },
        },
        { text: "Park & Exit", onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const handleScan = async (code: string) => {
    try {
      let product = products.find((p) => p.barcode === code || p.sku === code);
      if (!product) {
        const { productsService } = await import("../../../supabase/productsService");
        const foundProduct = await productsService.findProductByBarcode(
          organizationId!,
          code,
        );
        if (foundProduct) product = foundProduct;
      }
      if (product) {
        addItem(product);
        setScannerVisible(false);
      } else {
        Alert.alert("Not Found", `No product found with barcode: ${code}`);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to scan barcode.");
    }
  };

  const submitInvoice = async () => {
    const validation = validate();
    if (!validation.isValid) {
      Alert.alert(
        "Validation Error",
        validation.error || "Please check your input.",
      );
      return;
    }
    if (!selectedClient) {
      Alert.alert("Validation Error", "Please select a customer or vendor.");
      return;
    }

    const issueDate = new Date(invoiceDate);

    if (mode === "purchase") {
      const totalQuantity = lineItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const purchaseItems = lineItems.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        sku: item.product.sku ?? null,
        quantity: item.quantity,
        unit_price: item.rate,
        total_price: item.total,
      }));
      try {
        const orderNumber = await generatePurchaseOrderNumber();
        const created = await createPurchase.mutateAsync({
          purchase: {
            order_number: orderNumber,
            vendor_name: selectedClient.name,
            vendor_phone: selectedClient.phone ?? null,
            order_date: issueDate.toISOString(),
            total_quantity: totalQuantity,
            total_amount: finalTotal,
            status: "completed",
            notes: null,
          },
          items: purchaseItems,
        });
        resetInvoice();
        setMode(null);
        navigation.navigate("PurchaseDetail", {
          purchaseId: created.id,
          purchase: created,
        });
      } catch (err: any) {
        Alert.alert(
          "Failed to save",
          err?.message ?? "Unable to create purchase.",
        );
      }
      return;
    }

    const dueDate = new Date(issueDate);
    dueDate.setDate(issueDate.getDate() + 7);

    try {
      if (isEditMode && invoiceId) {
        const updated = await updateInvoice.mutateAsync({
          orderId: invoiceId,
          order: {
            status: "sent",
            subtotal,
            tax_amount: taxAmount,
            total_amount: finalTotal,
          },
          items: lineItems.map((i) => ({
            product_id: i.product.id,
            product_name: i.product.name,
            quantity: i.quantity,
            unit_price: i.rate,
            total_price: i.total,
            tax_amount: i.taxAmount,
            tax_rate: i.taxRate,
          })),
        });
        resetInvoice();
        setMode(null);
        navigation.reset({
          index: 1,
          routes: [
            { name: "InvoicesMain" },
            {
              name: "InvoiceDetail",
              params: { orderId: updated.id, invoice: updated },
            },
          ],
        });
      } else {
        const invoiceNumber = await generateInvoiceNumber();
        const created = await createInvoice.mutateAsync({
          order: {
            party_id: selectedClient.id,
            invoice_number: invoiceNumber,
            payment_status: "PENDING",
            status: "sent",
            subtotal,
            tax_amount: taxAmount,
            total_amount: finalTotal,
            notes: null,
          },
          items: lineItems.map((i) => ({
            product_id: i.product.id,
            product_name: i.product.name,
            quantity: i.quantity,
            unit_price: i.rate,
            total_price: i.total,
            tax_amount: i.taxAmount,
            tax_rate: i.taxRate,
          })),
        });
        resetInvoice();
        setMode(null);
        navigation.reset({
          index: 1,
          routes: [
            { name: "InvoicesMain" },
            {
              name: "InvoiceSummary",
              params: {
                invoiceId: created.id,
                invoiceNumber,
                subtotal,
                discount: discountAmt,
                cgst,
                sgst,
                totalAmount: finalTotal,
                amountReceived,
                dueDate: dueDate.toISOString(),
              },
            },
          ],
        });
      }
    } catch (err: any) {
      Alert.alert(
        "Failed to save",
        err?.message ??
          `Unable to ${isEditMode ? "update" : "create"} invoice.`,
      );
    }
  };

  return {
    validate,
    submitInvoice,
    handleBack,
    handleScan,
    isSubmitting,
  };
};
