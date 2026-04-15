import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomersStackParamList } from '../../navigation/types';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import DetailHeader from '../../components/DetailHeader';
import {
  Share2,
  Printer,
  Download,
  CreditCard,
  FileText,
  X,
  Edit,
} from 'lucide-react-native';
// Removed BillingPreview import - now using inline invoice display
import { pdfService } from '../../services/pdfService';
import StatusBadge from '../../components/ui/StatusBadge';
import { ReconciliationResult } from '../../utils/reconciliation';
import {
  Send,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import type { InvoicesStackParamList } from '../../navigation/types';
import {
  validateInvoiceIntegrity,
  calculateRepairedTotals,
} from '../../utils/reconciliation';
import {
  useRecordOrderPayment,
  useOrderDetail,
  useUpdateOrderStatus,
  useUpdateOrder,
} from '../../logic/orderLogic';



export type BillLineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

const formatCurrency = (value: number) =>
  `₹${(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

type InvoiceSummary = {
  id: string;
  invoice_number: string;
  client_name: string;
  created_at: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
};

type InvoiceDetailRoute = RouteProp<InvoicesStackParamList, 'InvoiceDetail'>;

const EMPTY_INVOICE: InvoiceSummary = {
  id: '',
  invoice_number: '',
  client_name: '',
  created_at: '',
  status: 'draft',
  subtotal: 0,
  tax_amount: 0,
  total_amount: 0,
};

// Status workflow validation
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

const getStatusTransitions = (currentStatus?: string): InvoiceStatus[] => {
  if (!currentStatus) return [];
  const status = currentStatus.toLowerCase() as InvoiceStatus;

  switch (status) {
    case 'draft':
      return ['sent']; // Draft can only go to Sent
    case 'sent':
      return ['paid', 'overdue']; // Sent can go to Paid or Overdue
    case 'overdue':
      return ['paid']; // Overdue can go to Paid
    case 'paid':
      return []; // Paid is final, no transitions allowed
    case 'cancelled':
      return []; // Cancelled is final, no transitions allowed
    default:
      return [];
  }
};

const getStatusLabel = (status?: string): string => {
  if (!status) return 'Draft';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const getStatusBadgeType = (
  status?: string,
): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s === 'paid') return 'success';
  if (s === 'overdue') return 'error';
  if (s === 'sent') return 'info';
  if (s === 'draft') return 'neutral';
  if (s === 'cancelled') return 'error';
  return 'neutral';
};

const InvoiceDetailScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NativeStackNavigationProp<InvoicesStackParamList>>();
  const route = useRoute<InvoiceDetailRoute>();
  const routeInvoice = route.params?.invoice ?? EMPTY_INVOICE;

  // Fetch full invoice data with items
  const { data: fullInvoice, isLoading: isLoadingInvoice } = useOrderDetail(
    routeInvoice.id,
  );

  // Use full invoice if available, otherwise fall back to route params
  const invoice = fullInvoice || routeInvoice;
  const subtotal =
    invoice.subtotal ?? invoice.total_amount - (invoice.tax_amount || 0);

  const { mutate: recordPayment, isPending: isRecordingPayment } =
    useRecordOrderPayment();

  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateOrderStatus();

  const { mutate: updateOrder, isPending: isRepairing } = useUpdateOrder();

  // Data Integrity Check
  const reconciliation = useMemo(() => {
    if (!fullInvoice) return null;
    return validateInvoiceIntegrity(fullInvoice);
  }, [fullInvoice]);

  const handleRepair = React.useCallback(() => {
    if (!fullInvoice?.items) return;

    const repairedTotals = calculateRepairedTotals(fullInvoice.items);

    Alert.alert(
      'Repair Invoice?',
      'This will recalculate the header totals (Subtotal, Tax, Final) based on the current line items and update the database to resolve the mismatch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Repair & Sync',
          onPress: () => {
            updateOrder(
              {
                orderId: fullInvoice.id,
                order: repairedTotals,
              },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'Invoice totals have been repaired.');
                },
                onError: (error: any) => {
                  Alert.alert('Repair Failed', error?.message || 'Unexpected error occurred.');
                },
              },
            );
          },
        },
      ],
    );
  }, [fullInvoice, updateOrder]);

  // Convert invoice items to BillLineItem format for BillingPreview
  const lineItems: BillLineItem[] = useMemo(() => {
    if (fullInvoice?.items) {
      return fullInvoice.items.map((item, index) => ({
        id: item.id || `item-${index}`,
        description: item.product_name,
        quantity: item.quantity,
        rate: item.unit_price,
      }));
    }
    return []; // No items until fullInvoice loads
  }, [fullInvoice]);

  // Calculate tax amount from line items with GST rates
  const calculatedTaxAmount = useMemo(() => {
    if (fullInvoice?.items) {
      return fullInvoice.items.reduce((total, item) => {
        const itemTotal = item.quantity * item.unit_price;
        const gstRate = item.gst_rate || 0; // Use GST rate from item, default to 0
        const taxAmount = (itemTotal * gstRate) / 100;
        return total + taxAmount;
      }, 0);
    }
    return 0;
  }, [fullInvoice]);

  // Use calculated tax if invoice tax_amount is zero or missing
  const taxAmount = invoice.tax_amount && invoice.tax_amount > 0 
    ? invoice.tax_amount 
    : calculatedTaxAmount;

  const handleShare = React.useCallback(async () => {
    if (!fullInvoice) {
      Alert.alert(
        'Error',
        'Invoice data not available. Please wait for it to load.',
      );
      return;
    }

    try {
      await pdfService.shareInvoiceAsPDF(fullInvoice);
    } catch (error: unknown) {
      const { logger } = await import('../../utils/logger');
      logger.error('Failed to share invoice:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to share invoice. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  }, [fullInvoice]);

  const handleDownload = React.useCallback(async () => {
    if (!fullInvoice) {
      Alert.alert(
        'Error',
        'Invoice data not available. Please wait for it to load.',
      );
      return;
    }

    try {
      // Generate PDF file using expo-print
      const fileUri = await pdfService.generateInvoicePDF(fullInvoice);

      // Check if PDF was generated or if it's HTML fallback
      if (fileUri.startsWith('file://') || fileUri.startsWith('/')) {
        try {
          const Sharing = require('expo-sharing');
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Save Invoice ${fullInvoice.invoice_number}`,
              UTI: 'com.adobe.pdf',
            });
          } else {
            Alert.alert(
              'Success',
              'Invoice PDF generated. Use Share button to access it.',
              [{ text: 'OK' }],
            );
          }
        } catch (shareError: unknown) {
          // Fallback to sharing via pdfService
          await pdfService.shareInvoiceAsPDF(fullInvoice);
        }
      } else {
        // HTML fallback
        Alert.alert(
          'Info',
          'PDF generation not available. Use the Share button to share as text.',
          [{ text: 'OK' }],
        );
      }
    } catch (error: unknown) {
      const { logger } = await import('../../utils/logger');
      logger.error('Failed to download invoice:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to download invoice. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  }, [fullInvoice]);

  const handlePrint = React.useCallback(() => {
    Alert.alert(
      'Print',
      'Print functionality will be available soon. Use Share to send the invoice.',
    );
  }, []);

  const handleCancel = React.useCallback(async () => {
    if (!invoice?.id) {
      Alert.alert('Error', 'Invoice ID not available.');
      return;
    }

    if (invoice.status === 'cancelled') {
      Alert.alert('Info', 'This invoice is already cancelled.');
      return;
    }

    Alert.alert(
      'Cancel Invoice',
      'Are you sure you want to cancel this invoice? Stock will be restored for all items.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { ordersService } = await import(
                '../../supabase/ordersService'
              );
              await ordersService.cancelOrder(
                (invoice as any).organization_id || '',
                invoice.id,
              );
              Alert.alert(
                'Success',
                'Invoice cancelled successfully. Stock has been restored.',
              );
              // Refresh invoice data
              navigation.goBack();
            } catch (error: unknown) {
              const { logger } = await import('../../utils/logger');
              logger.error('Failed to cancel invoice:', error);
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Failed to cancel invoice. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ],
    );
  }, [invoice, navigation]);

  const handleCollect = React.useCallback(() => {
    if (!invoice?.id) {
      Alert.alert('Unable to record payment', 'Missing invoice identifier.');
      return;
    }

    recordPayment(
      { orderId: invoice.id, amount: invoice.total_amount },
      {
        onError: error => {
          const message =
            error instanceof Error
              ? error.message
              : 'Unable to record payment. Please try again.';
          Alert.alert('Payment failed', message);
        },
      },
    );
  }, [invoice, recordPayment]);

  const handleEdit = React.useCallback(() => {
    if (!invoice?.id) {
      Alert.alert('Error', 'Invoice ID not available.');
      return;
    }

    navigation.navigate('AddSale', {
      orderId: invoice.id,
      initialMode: 'sale',
    });
  }, [invoice, navigation]);

  const handleStatusChange = React.useCallback(
    (newStatus: string) => {
      if (!invoice?.id) {
        Alert.alert('Error', 'Invoice ID not available.');
        return;
      }

      const currentStatus = invoice.status?.toLowerCase() || 'draft';
      const transitions = getStatusTransitions(currentStatus);

      if (!transitions.includes(newStatus as InvoiceStatus)) {
        Alert.alert(
          'Invalid Status Change',
          `Cannot change status from ${getStatusLabel(
            currentStatus,
          )} to ${getStatusLabel(newStatus)}.`,
        );
        return;
      }

      const statusMessages: Record<string, string> = {
        sent: 'Mark this invoice as sent to the customer?',
        paid: 'Mark this invoice as paid? This will record full payment.',
        overdue: 'Mark this invoice as overdue?',
      };

      Alert.alert(
        'Change Invoice Status',
        statusMessages[newStatus] ||
          `Change invoice status to ${getStatusLabel(newStatus)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              updateStatus(
                { orderId: invoice.id, paymentStatus: newStatus.toUpperCase() },
                {
                  onSuccess: () => {
                    Alert.alert(
                      'Success',
                      `Invoice status updated to ${getStatusLabel(newStatus)}.`,
                    );
                  },
                  onError: (error: unknown) => {
                    const { logger } = require('../../utils/logger');
                    logger.error('Failed to update invoice status:', error);
                    const errorMessage =
                      error instanceof Error
                        ? error.message
                        : 'Failed to update invoice status. Please try again.';
                    Alert.alert('Error', errorMessage);
                  },
                },
              );
            },
          },
        ],
      );
    },
    [invoice, updateStatus],
  );

  if (isLoadingInvoice && !fullInvoice) {
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={tokens.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <DetailHeader
        title="Invoice Details"
        actions={[
          {
            icon: <Edit size={18} color={tokens.foreground} />,
            onPress: handleEdit,
            accessibilityLabel: 'Edit invoice',
          },
          {
            icon: <Share2 size={18} color={tokens.foreground} />,
            onPress: handleShare,
            accessibilityLabel: 'Share invoice',
          },
          {
            icon: <Download size={18} color={tokens.foreground} />,
            onPress: handleDownload,
            accessibilityLabel: 'Download invoice',
          },
          {
            icon: <Printer size={18} color={tokens.foreground} />,
            onPress: handlePrint,
            accessibilityLabel: 'Print invoice',
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Data Mismatch Banner */}
        {reconciliation && !reconciliation.isValid && (
          <View style={styles.mismatchBanner}>
            <View style={styles.mismatchIconWrap}>
              <AlertTriangle size={20} color={tokens.destructive} />
            </View>
            <View style={styles.mismatchCopy}>
              <Text style={styles.mismatchTitle}>Data Integrity Error</Text>
              <Text style={styles.mismatchText}>
                The sum of items (₹{reconciliation.expectedTotal}) does not match the recorded total (₹{reconciliation.actualTotal}).
              </Text>
            </View>
            <Pressable
              style={styles.repairButton}
              onPress={handleRepair}
              disabled={isRepairing}
            >
              {isRepairing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <RefreshCw size={14} color="#fff" />
                  <Text style={styles.repairButtonText}>Repair</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Inline Invoice Display */}
        <View style={styles.invoiceCard}>
          <View style={styles.brandRow}>
            <View>
              <Text style={styles.brandName}>BillZest Retailers</Text>
              <Text style={styles.brandMeta}>GSTIN: 27AAACB2230M1ZT</Text>
              <Text style={styles.brandMeta}>
                402, Skylark Business Park, Mumbai
              </Text>
            </View>
            {invoice.status && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeLabel}>{invoice.status.toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Invoice No.</Text>
              <Text style={styles.metaValue}>#{invoice.invoice_number}</Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Issue Date</Text>
              <Text style={styles.metaValue}>
                {new Date(invoice.created_at || new Date()).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>
                {new Date(invoice.created_at || new Date()).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.billToRow}>
            <View style={styles.billToBlock}>
              <Text style={styles.metaLabel}>Bill To</Text>
              <Text style={styles.metaValue}>
                {fullInvoice?.party?.name || (invoice as any).client_name || 'Customer'}
              </Text>
              {(fullInvoice?.party as any)?.phone && (
                <Text style={styles.metaSubValue}>
                  {(fullInvoice?.party as any).phone}
                  {(fullInvoice?.party as any)?.email && ` · ${(fullInvoice?.party as any).email}`}
                </Text>
              )}
            </View>
            <View style={styles.billToBlock}>
              <Text style={styles.metaLabel}>Payment Terms</Text>
              <Text style={styles.metaValue}>15 days credit</Text>
              <Text style={styles.metaSubValue}>UPI · Bank Transfer</Text>
            </View>
          </View>

          <View style={styles.itemsTable}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.colDescription, styles.headerText]}>
                Description
              </Text>
              <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
              <Text style={[styles.colRate, styles.headerText]}>Rate</Text>
              <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
            </View>
            {lineItems.length > 0 ? (
              lineItems.map(item => {
                const amount = item.rate * item.quantity;
                return (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={styles.colDescription}>{item.description}</Text>
                    <Text style={styles.colQty}>{item.quantity}</Text>
                    <Text style={styles.colRate}>{formatCurrency(item.rate)}</Text>
                    <Text style={styles.colAmount}>{formatCurrency(amount)}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No items in this invoice</Text>
              </View>
            )}
          </View>

          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (18%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelBold}>Grand Total</Text>
              <Text style={styles.totalValueBold}>
                {formatCurrency(invoice.total_amount)}
              </Text>
            </View>
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.footerNoteTitle}>Notes</Text>
            <Text style={styles.footerNoteText}>
              {fullInvoice?.notes || (invoice as any).notes || 
                'Thank you for shopping with us. This invoice was generated from BillZest.'}
            </Text>
          </View>
        </View>

        {/* Status Workflow Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Invoice Status</Text>
            <StatusBadge
              status={getStatusBadgeType(invoice.status)}
              label={getStatusLabel(invoice.status).toUpperCase()}
              size="sm"
            />
          </View>

          {(() => {
            const transitions = getStatusTransitions(invoice.status);
            if (transitions.length === 0) {
              return (
                <Text style={styles.statusMessage}>
                  {invoice.status === 'paid' 
                    ? 'This invoice is paid and marked as final.' 
                    : invoice.status === 'cancelled'
                      ? 'This invoice has been cancelled.'
                      : 'This invoice is in final status and cannot be changed.'
                  }
                </Text>
              );
            }

            return (
              <View style={styles.statusActions}>
                <Text style={styles.statusSubtitle}>Update Status:</Text>
                <View style={styles.statusButtons}>
                  {transitions.map(targetStatus => (
                    <Pressable
                      key={targetStatus}
                      style={[
                        styles.statusButton,
                        targetStatus === 'paid' && styles.statusButtonPrimary,
                        targetStatus === 'overdue' && styles.statusButtonDanger,
                        isUpdatingStatus && styles.statusButtonDisabled,
                      ]}
                      onPress={() => handleStatusChange(targetStatus)}
                      disabled={isUpdatingStatus}
                    >
                      {targetStatus === 'sent' && (
                        <Send size={16} color={tokens.foreground} />
                      )}
                      {targetStatus === 'paid' && (
                        <CheckCircle size={16} color="#fff" />
                      )}
                      {targetStatus === 'overdue' && (
                        <ArrowRight size={16} color={tokens.destructive} />
                      )}
                      <Text
                        style={[
                          styles.statusButtonText,
                          targetStatus === 'paid' &&
                            styles.statusButtonTextPrimary,
                          targetStatus === 'overdue' &&
                            styles.statusButtonTextDanger,
                        ]}
                      >
                        Mark as {getStatusLabel(targetStatus)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })()}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Journey</Text>
            <FileText color={tokens.primary} size={18} />
          </View>
          <View style={styles.timelineRow}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineCopy}>
              <Text style={styles.timelineLabel}>Invoice created</Text>
              <Text style={styles.timelineMeta}>
                {invoice.created_at
                  ? new Date(invoice.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.actionContainer}>
            <View style={styles.paymentBanner}>
              <CreditCard color={tokens.primary} size={18} />
              <View style={styles.paymentCopy}>
                <Text style={styles.paymentTitle}>
                  Collect {formatCurrency(invoice.total_amount)}
                </Text>
                <Text style={styles.paymentMeta}>
                  Share payment link or download PDF
                </Text>
              </View>
              <Pressable
                style={styles.primaryButton}
                onPress={handleCollect}
                disabled={
                  isRecordingPayment ||
                  invoice.status === 'paid' ||
                  invoice.status === 'cancelled'
                }
              >
                <Text style={styles.primaryButtonText}>
                  {isRecordingPayment ? 'Recording…' : 'Collect'}
                </Text>
              </Pressable>
            </View>

            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
              <Pressable
                style={[styles.cancelButton, { borderColor: tokens.destructive }]}
                onPress={handleCancel}
              >
                <X size={16} color={tokens.destructive} />
                <Text
                  style={[styles.cancelButtonText, { color: tokens.destructive }]}
                >
                  Cancel Invoice
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    content: {
      padding: tokens.spacingLg, // 16px
      paddingBottom: tokens.spacingXxl, // 32px
    },
    // Card, table and footer styles are now owned by BillingPreview
    sectionCard: {
      borderRadius: tokens.radiusLg, // 16px
      backgroundColor: tokens.card,
      padding: tokens.spacingLg, // 16px
      marginBottom: tokens.spacingMd, // 12px
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    mismatchBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.destructiveAlpha15,
      padding: tokens.spacingMd,
      borderRadius: tokens.radiusLg,
      marginBottom: tokens.spacingLg,
      borderWidth: 1,
      borderColor: tokens.destructiveAlpha30,
    },
    mismatchIconWrap: {
      marginRight: tokens.spacingMd,
    },
    mismatchCopy: {
      flex: 1,
    },
    mismatchTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: tokens.destructive,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    mismatchText: {
      fontSize: 12,
      color: tokens.destructive,
      opacity: 0.8,
    },
    repairButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.destructive,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: tokens.radiusMd,
      gap: 6,
    },
    repairButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacingSm, // 8px
    },
    sectionTitle: {
      fontSize: 16, // Primary size
      fontWeight: '700', // Bold for emphasis
      color: tokens.foreground,
    },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tokens.spacingSm, // 8px
    },
    timelineDot: {
      width: tokens.spacingSm, // 8px
      height: tokens.spacingSm, // 8px
      borderRadius: tokens.radiusXs, // 4px
      backgroundColor: tokens.primary,
      marginRight: tokens.spacingSm, // 8px
    },
    timelineCopy: {
      flex: 1,
    },
    timelineLabel: {
      fontWeight: '600', // Semi-bold
      color: tokens.foreground,
      fontSize: 14, // Emphasis size
    },
    timelineMeta: {
      color: tokens.mutedForeground,
      fontSize: 12, // Secondary size
      marginTop: tokens.spacingXs, // 4px
    },
    actionContainer: {
      gap: tokens.spacingSm, // 8px
    },
    paymentBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: tokens.radiusLg, // 16px
      padding: tokens.spacingMd, // 12px
      backgroundColor: tokens.surface_container_low,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    paymentCopy: {
      flex: 1,
      marginLeft: tokens.spacingSm, // 8px
    },
    paymentTitle: {
      fontWeight: '700', // Bold for emphasis
      color: tokens.foreground,
      fontSize: 15, // Primary size
    },
    paymentMeta: {
      color: tokens.mutedForeground,
      marginTop: tokens.spacingXs, // 4px
      fontSize: 12, // Secondary size
    },
    primaryButton: {
      backgroundColor: tokens.primary,
      borderRadius: tokens.radiusFull, // 999
      paddingHorizontal: tokens.spacingLg, // 16px
      paddingVertical: tokens.spacingSm, // 8px
    },
    primaryButtonText: {
      color: tokens.primaryForeground,
      fontWeight: '700', // Bold for emphasis
      fontSize: 14, // Emphasis size
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radiusFull, // 999
      backgroundColor: tokens.muted,
      paddingHorizontal: tokens.spacingLg, // 16px
      paddingVertical: tokens.spacingSm, // 8px
      marginTop: tokens.spacingSm, // 8px
      gap: tokens.spacingXs, // 4px
    },
    cancelButtonText: {
      fontWeight: '600', // Semi-bold
      fontSize: 14, // Emphasis size
    },
    statusMessage: {
      color: tokens.mutedForeground,
      fontSize: 14, // Emphasis size
      textAlign: 'center',
      paddingVertical: tokens.spacingSm, // 8px
    },
    statusActions: {
      marginTop: tokens.spacingSm, // 8px
    },
    statusSubtitle: {
      color: tokens.mutedForeground,
      fontSize: 13, // Secondary size
      marginBottom: tokens.spacingSm, // 8px
      fontWeight: '600', // Semi-bold
    },
    statusButtons: {
      gap: tokens.spacingSm, // 8px
    },
    statusButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radiusSm, // 8px
      paddingHorizontal: tokens.spacingLg, // 16px
      paddingVertical: tokens.spacingSm, // 8px
      backgroundColor: tokens.muted,
      gap: tokens.spacingXs, // 4px
    },
    statusButtonPrimary: {
      backgroundColor: tokens.primary,
      borderColor: tokens.primary,
    },
    statusButtonDanger: {
      borderColor: tokens.destructive,
    },
    statusButtonDisabled: {
      opacity: 0.5,
    },
    statusButtonText: {
      color: tokens.foreground,
      fontWeight: '600', // Semi-bold
      fontSize: 14, // Emphasis size
    },
    statusButtonTextPrimary: {
      color: tokens.primaryForeground,
    },
    statusButtonTextDanger: {
      color: tokens.destructive,
    },
    // Invoice Display Styles (from BillingPreview)
    invoiceCard: {
      borderRadius: tokens.radiusLg, // 16px
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: tokens.spacingLg, // 16px
      marginBottom: tokens.spacingLg, // 16px
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    brandRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: tokens.spacingLg, // 16px
    },
    brandName: {
      fontSize: 18, // Slightly smaller for better balance
      fontWeight: '700', // Bold for emphasis
      color: tokens.foreground,
      letterSpacing: -0.2,
    },
    brandMeta: {
      color: tokens.mutedForeground,
      fontSize: 12, // Secondary size
      marginTop: tokens.spacingXs, // 4px
      lineHeight: 16,
    },
    metaBadge: {
      borderRadius: tokens.radiusFull, // 999
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: tokens.spacingXs, // 4px
      backgroundColor: tokens.surface_container_low,
    },
    metaBadgeLabel: {
      fontSize: 11, // Smaller for better proportion
      fontWeight: '700', // Bold for emphasis
      color: tokens.primary,
      letterSpacing: 0.5,
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacingSm, // 8px
      marginBottom: tokens.spacingLg, // 16px
    },
    metaBlock: {
      flex: 1,
      minWidth: 140,
      backgroundColor: tokens.surface_container_low,
      borderRadius: tokens.radiusSm, // 8px
      padding: tokens.spacingMd, // 12px
    },
    metaLabel: {
      fontSize: 11, // Small size for labels
      fontWeight: '600', // Semi-bold
      color: tokens.mutedForeground,
      marginBottom: tokens.spacingXs, // 4px
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metaValue: {
      fontSize: 14, // Emphasis size
      fontWeight: '600', // Semi-bold
      color: tokens.foreground,
    },
    metaSubValue: {
      fontSize: 12, // Secondary size
      color: tokens.mutedForeground,
      marginTop: tokens.spacingXs, // 4px
    },
    billToRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacingSm, // 8px
      marginBottom: tokens.spacingLg, // 16px
    },
    billToBlock: {
      flex: 1,
      backgroundColor: tokens.surface_container_low,
      borderRadius: tokens.radiusSm, // 8px
      padding: tokens.spacingMd, // 12px
    },
    itemsTable: {
      borderRadius: tokens.radiusSm, // 8px
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      marginBottom: tokens.spacingLg, // 16px
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: tokens.spacingSm, // 8px
      paddingHorizontal: tokens.spacingMd, // 12px
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    tableHeader: {
      backgroundColor: tokens.surface_container_low,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    headerText: {
      fontWeight: '700', // Bold for emphasis
      color: tokens.foreground,
      fontSize: 12, // Secondary size
      letterSpacing: 0.3,
    },
    colDescription: {
      flex: 2,
      color: tokens.foreground,
      fontSize: 14, // Emphasis size
      fontWeight: '500', // Medium weight
    },
    colQty: {
      flex: 0.5,
      color: tokens.foreground,
      textAlign: 'center',
      fontSize: 14, // Emphasis size
      fontWeight: '500', // Medium weight
    },
    colRate: {
      flex: 1,
      color: tokens.foreground,
      textAlign: 'right',
      fontSize: 14, // Emphasis size
      fontWeight: '500', // Medium weight
    },
    colAmount: {
      flex: 1,
      color: tokens.foreground,
      textAlign: 'right',
      fontSize: 14, // Emphasis size
      fontWeight: '600', // Semi-bold for emphasis
    },
    emptyState: {
      paddingVertical: tokens.spacingXxl, // 32px
      alignItems: 'center',
      backgroundColor: tokens.surface_container_low,
    },
    emptyStateText: {
      color: tokens.mutedForeground,
      fontSize: 14, // Emphasis size
      fontWeight: '600', // Semi-bold
      textAlign: 'center',
    },
    totalCard: {
      borderRadius: tokens.radiusSm, // 8px
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface_container_low,
      padding: tokens.spacingLg, // 16px
      marginBottom: tokens.spacingLg, // 16px
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacingSm, // 8px
    },
    totalLabel: {
      color: tokens.mutedForeground,
      fontSize: 14, // Emphasis size
      fontWeight: '500', // Medium weight
    },
    totalValue: {
      color: tokens.foreground,
      fontWeight: '600', // Semi-bold
      fontSize: 15, // Primary size
    },
    totalLabelBold: {
      color: tokens.foreground,
      fontWeight: '700', // Bold for emphasis
      fontSize: 16, // Primary size
    },
    totalValueBold: {
      color: tokens.primary,
      fontWeight: '700', // Bold for emphasis
      fontSize: 18, // Larger for emphasis
    },
    totalDivider: {
      height: 1,
      backgroundColor: tokens.border,
      marginVertical: tokens.spacingSm, // 8px
    },
    footerNote: {
      backgroundColor: tokens.surface_container_low,
      borderRadius: tokens.radiusSm, // 8px
      padding: tokens.spacingLg, // 16px
    },
    footerNoteTitle: {
      fontWeight: '700', // Bold for emphasis
      color: tokens.foreground,
      fontSize: 14, // Emphasis size
      marginBottom: tokens.spacingXs, // 4px
    },
    footerNoteText: {
      color: tokens.mutedForeground,
      fontSize: 13, // Secondary size
      lineHeight: 18,
    },
  });

export default InvoiceDetailScreen;
