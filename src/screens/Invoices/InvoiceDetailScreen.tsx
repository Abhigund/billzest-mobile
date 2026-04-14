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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
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
import BillingPreview, { BillLineItem } from '../../components/BillingPreview';
import {
  useRecordOrderPayment,
  useOrderDetail,
  useUpdateOrderStatus,
} from '../../logic/orderLogic';
import { pdfService } from '../../services/pdfService';
import StatusBadge from '../../components/ui/StatusBadge';
import { Send, CheckCircle, ArrowRight } from 'lucide-react-native';
import type { AppNavigationParamList } from '../../navigation/types';

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

type InvoiceDetailRoute = RouteProp<
  {
    InvoiceDetail: {
      invoice?: InvoiceSummary;
    };
  },
  'InvoiceDetail'
>;

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
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
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
                { orderId: invoice.id, status: newStatus },
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
        title="Invoice Preview"
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
        <BillingPreview
          status={invoice.status}
          numberLabel="Invoice No."
          numberValue={`#${invoice.invoice_number}`}
          primaryDateLabel="Issue Date"
          primaryDateValue={new Date(
            invoice.created_at || new Date(),
          ).toLocaleDateString()}
          secondaryDateLabel="Due Date"
          secondaryDateValue={new Date(
            invoice.created_at || new Date(),
          ).toLocaleDateString()}
          partyLabel="Bill To"
          partyName={
            fullInvoice?.party?.name ||
            (invoice as any).client_name ||
            'Customer'
          }
          partySubValue={
            (fullInvoice?.party as any)?.phone
              ? `${(fullInvoice?.party as any).phone}${
                  (fullInvoice?.party as any).email
                    ? ` · ${(fullInvoice?.party as any).email}`
                    : ''
                }`
              : undefined
          }
          subtotal={subtotal}
          taxAmount={invoice.tax_amount || 0}
          totalAmount={invoice.total_amount}
          notes={fullInvoice?.notes || (invoice as any).notes || undefined}
          items={lineItems}
        />

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
                  This invoice is in final status and cannot be changed.
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
      padding: 20,
      paddingBottom: 40,
    },
    // Card, table and footer styles are now owned by BillingPreview
    sectionCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: 18,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
    },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    timelineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: tokens.primary,
      marginRight: 10,
    },
    timelineCopy: {
      flex: 1,
    },
    timelineLabel: {
      fontWeight: '600',
      color: tokens.foreground,
    },
    timelineMeta: {
      color: tokens.mutedForeground,
      fontSize: 12,
      marginTop: 2,
    },
    paymentBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 14,
      marginTop: 8,
      backgroundColor: tokens.background,
    },
    paymentCopy: {
      flex: 1,
      marginLeft: 12,
    },
    paymentTitle: {
      fontWeight: '700',
      color: tokens.foreground,
    },
    paymentMeta: {
      color: tokens.mutedForeground,
      marginTop: 2,
      fontSize: 12,
    },
    primaryButton: {
      backgroundColor: tokens.primary,
      borderRadius: 999,
      paddingHorizontal: 18,
      paddingVertical: 8,
    },
    primaryButtonText: {
      color: tokens.primaryForeground,
      fontWeight: '700',
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 18,
      paddingVertical: 10,
      marginTop: 12,
      gap: 8,
    },
    cancelButtonText: {
      fontWeight: '600',
      fontSize: 15,
    },
    statusMessage: {
      color: tokens.mutedForeground,
      fontSize: 14,
      textAlign: 'center',
      paddingVertical: 8,
    },
    statusActions: {
      marginTop: 12,
    },
    statusSubtitle: {
      color: tokens.mutedForeground,
      fontSize: 13,
      marginBottom: 10,
      fontWeight: '600',
    },
    statusButtons: {
      gap: 10,
    },
    statusButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: tokens.card,
      gap: 8,
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
      fontWeight: '600',
      fontSize: 14,
    },
    statusButtonTextPrimary: {
      color: tokens.primaryForeground,
    },
    statusButtonTextDanger: {
      color: tokens.destructive,
    },
  });

export default InvoiceDetailScreen;
