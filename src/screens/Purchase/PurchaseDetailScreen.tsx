import React, { useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/ui/Button';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { ArrowLeft, Truck, CalendarDays, FileText, AlertTriangle, Share2, Download } from 'lucide-react-native';
import EmptyState from '../../components/EmptyState';
import { usePurchaseDetail, useUpdatePurchaseStatus } from '../../logic/purchaseLogic';
// Removed BillingPreview import - now using inline display
import { pdfService } from '../../services/pdfService';
import DetailHeader from '../../components/DetailHeader';
import PurchaseReceiveSheet from '../../components/modals/PurchaseReceiveSheet';
import { useReceiveItems } from '../../logic/purchaseLogic';
import type { AppNavigationParamList } from '../../navigation/types';

export type BillLineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

type PurchaseDetailRoute = RouteProp<
  {
    PurchaseDetail: {
      purchaseId?: string;
      purchase?: any;
    };
  },
  'PurchaseDetail'
>;

const PurchaseDetailScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const route = useRoute<PurchaseDetailRoute>();
  const purchaseId = route.params?.purchaseId ?? route.params?.purchase?.id;

  const {
    data: purchase,
    isLoading,
    error,
    refetch,
  } = usePurchaseDetail(purchaseId);

  const {
    mutate: updateStatus,
    isPending: isUpdatingStatus,
  } = useUpdatePurchaseStatus();

  const {
    mutateAsync: receiveItems,
    isPending: isReceiving,
  } = useReceiveItems();

  const [isReceiveSheetVisible, setIsReceiveSheetVisible] = React.useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Convert purchase items to BillLineItem format
  const lineItems: BillLineItem[] = React.useMemo(() => {
    if (purchase?.purchase_order_items) {
      return purchase.purchase_order_items.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        description: item.product_name || 'Item',
        quantity: item.quantity || 0,
        rate: item.unit_price || 0,
      }));
    }
    return [];
  }, [purchase]);

  const goBack = () => navigation.goBack();
  
  const handleMarkReceived = useCallback(() => {
    if (!purchase || !purchaseId) {
      Alert.alert('Error', 'Purchase data not available.');
      return;
    }

    if (purchase.status?.toLowerCase() === 'received') {
      Alert.alert('Info', 'This purchase is already received.');
      return;
    }

    setIsReceiveSheetVisible(true);
  }, [purchase, purchaseId]);

  const handleReceiveSubmit = async (items: any[]) => {
    try {
      if (!purchaseId) return;
      await receiveItems({ p_po_id: purchaseId, p_items: items });
      Alert.alert('Success', 'Items received and inventory updated successfully.');
      setIsReceiveSheetVisible(false);
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to receive items.');
    }
  };

  const receiveSheetItems = React.useMemo(() => {
    if (!purchase || !purchase.purchase_order_items) return [];
    
    return purchase.purchase_order_items.map((item: any) => {
      const alreadyRcvd = item.received_quantity || 0;
      const qty = item.quantity || 0;
      const remaining = Math.max(0, qty - alreadyRcvd);
      
      return {
        item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || 'Item',
        quantity: qty,
        already_received: alreadyRcvd,
        received_qty: remaining, // default to remaining
        unit_price: item.unit_price || 0,
        selling_price: item.selling_price || 0,
        mrp: item.mrp || 0,
        batch_number: item.batch_number || '',
        mfg_date: item.mfg_date || '',
        expiry_date: item.expiry_date || '',
        notes: item.notes || '',
      };
    });
  }, [purchase]);

  const handleEdit = () => {
    if (purchase) {
      navigation.navigate('PurchaseCreate', { purchase });
    } else {
      navigation.navigate('PurchaseCreate');
    }
  };

  const handleShare = useCallback(async () => {
    if (!purchase) {
      Alert.alert('Error', 'Purchase data not available. Please wait for it to load.');
      return;
    }

    try {
      await pdfService.sharePurchaseReceiptAsPDF(purchase);
    } catch (error: unknown) {
      const { logger } = await import('../../utils/logger');
      logger.error('Failed to share purchase receipt:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to share purchase receipt. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  }, [purchase]);

  const handleDownload = useCallback(async () => {
    if (!purchase) {
      Alert.alert('Error', 'Purchase data not available. Please wait for it to load.');
      return;
    }

    try {
      const filePath = await pdfService.downloadPurchaseReceiptPDF(purchase);
      Alert.alert(
        'Download Complete',
        `Purchase receipt saved to: ${filePath}\n\nYou can find it in your device's ${Platform.OS === 'ios' ? 'Files app (On My iPhone/BillZest)' : 'Downloads folder'}.`,
        [{ text: 'OK' }]
      );
    } catch (error: unknown) {
      const { logger } = await import('../../utils/logger');
      logger.error('Failed to download purchase receipt:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to download purchase receipt. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  }, [purchase]);

  return (
    <ScreenWrapper>
      <DetailHeader
        title={purchase?.order_number ?? 'Purchase Detail'}
        onBack={goBack}
        actions={
          purchase
            ? [
                {
                  icon: <Share2 size={18} color={tokens.foreground} />,
                  onPress: handleShare,
                  accessibilityLabel: 'Share purchase order',
                },
                {
                  icon: <Download size={18} color={tokens.foreground} />,
                  onPress: handleDownload,
                  accessibilityLabel: 'Download purchase order',
                },
              ]
            : []
        }
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {isLoading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={tokens.primary} />
            <Text style={styles.loaderText}>Loading purchase…</Text>
          </View>
        ) : null}

        {error ? (
          <EmptyState
            icon={<AlertTriangle color={tokens.primary} size={28} />}
            title="Couldn’t load purchase"
            description="Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        ) : null}

        {!isLoading && !error && !purchase ? (
          <EmptyState
            icon={<AlertTriangle color={tokens.primary} size={28} />}
            title="Purchase not found"
            description="This purchase may have been removed."
          />
        ) : null}

        {purchase ? (
          <>
            {/* Inline Purchase Display */}
            <View style={styles.invoiceCard}>
              <View style={styles.brandRow}>
                <View>
                  <Text style={styles.brandName}>BillZest Retailers</Text>
                  <Text style={styles.brandMeta}>GSTIN: 27AAACB2230M1ZT</Text>
                  <Text style={styles.brandMeta}>
                    402, Skylark Business Park, Mumbai
                  </Text>
                </View>
                {purchase.status && (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeLabel}>{purchase.status.toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Order #</Text>
                  <Text style={styles.metaValue}>{purchase.order_number ?? '—'}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Order Date</Text>
                  <Text style={styles.metaValue}>
                    {purchase.order_date
                      ? new Date(purchase.order_date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })
                      : '—'
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.billToRow}>
                <View style={styles.billToBlock}>
                  <Text style={styles.metaLabel}>Supplier</Text>
                  <Text style={styles.metaValue}>{purchase.vendor_name ?? 'Unknown Vendor'}</Text>
                  {purchase.vendor_phone && (
                    <Text style={styles.metaSubValue}>{purchase.vendor_phone}</Text>
                  )}
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
                    <Text style={styles.emptyStateText}>No items in this order</Text>
                  </View>
                )}
              </View>

              <View style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValueBold}>
                    {formatCurrency(purchase.total_amount ?? 0)}
                  </Text>
                </View>
              </View>

              {purchase.notes && (
                <View style={styles.footerNote}>
                  <Text style={styles.footerNoteTitle}>Notes</Text>
                  <Text style={styles.footerNoteText}>{purchase.notes}</Text>
                </View>
              )}
            </View>

            <View style={styles.actionsRow}>
              {purchase.status?.toLowerCase() !== 'received' && (
                <Button
                  label={isUpdatingStatus ? 'Updating...' : 'Mark as Received'}
                  fullWidth
                  onPress={handleMarkReceived}
                  disabled={isUpdatingStatus}
                  style={styles.markReceivedButton}
                />
              )}
              <View style={styles.secondaryActionsRow}>
                <Button
                  label="Print Labels"
                  variant="outline"
                  onPress={() => {
                    const items = (purchase.purchase_order_items || []).map((item: any) => ({
                      id: item.product_id,
                      name: item.product_name,
                      barcode: item.barcode || '',
                      selling_price: item.selling_price || 0,
                      quantity: item.quantity || 1,
                    }));
                    navigation.navigate('ProductsTab', {
                      screen: 'BarcodeGenerator',
                      params: { initialItems: items },
                    });
                  }}
                  style={[styles.editButton, { flex: 1, marginRight: 8 }]}
                  disabled={isUpdatingStatus || isReceiving}
                />
                <Button
                  label="Edit"
                  variant="secondary"
                  onPress={handleEdit}
                  style={[styles.editButton, { flex: 1 }]}
                  disabled={isUpdatingStatus || isReceiving}
                />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <PurchaseReceiveSheet
        visible={isReceiveSheetVisible}
        onClose={() => setIsReceiveSheetVisible(false)}
        items={receiveSheetItems}
        onSubmit={handleReceiveSubmit}
        isLoading={isReceiving}
      />
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 80,
    },
    // Card, table and notes styles now come from BillingPreview
    actionsRow: {
      padding: 20,
      paddingTop: 0,
    },
    secondaryActionsRow: {
      flexDirection: 'row',
      marginTop: 12,
    },
    markReceivedButton: {
      marginBottom: 0,
    },
    editButton: {
      marginTop: 0,
    },
    loaderBox: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    loaderText: {
      marginTop: 8,
      color: tokens.mutedForeground,
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
    totalValueBold: {
      color: tokens.primary,
      fontWeight: '700', // Bold for emphasis
      fontSize: 18, // Larger for emphasis
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

export default PurchaseDetailScreen;
