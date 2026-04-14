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
import BillingPreview, {
  BillLineItem,
} from '../../components/BillingPreview';
import { pdfService } from '../../services/pdfService';
import DetailHeader from '../../components/DetailHeader';
import PurchaseReceiveSheet from '../../components/modals/PurchaseReceiveSheet';
import { useReceiveItems } from '../../logic/purchaseLogic';
import type { AppNavigationParamList } from '../../navigation/types';

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
            <BillingPreview
              status={purchase.status ?? 'completed'}
              numberLabel="Order #"
              numberValue={purchase.order_number ?? '—'}
              primaryDateLabel="Order Date"
              primaryDateValue={
                purchase.order_date
                  ? new Date(purchase.order_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })
                  : '—'
              }
              partyLabel="Supplier"
              partyName={purchase.vendor_name ?? 'Unknown Vendor'}
              partySubValue={purchase.vendor_phone ?? '—'}
              subtotal={purchase.total_amount ?? 0}
              taxAmount={0}
              totalAmount={purchase.total_amount ?? 0}
              notes={purchase.notes ?? undefined}
              items={(purchase.purchase_order_items ?? []).map((item: any): BillLineItem => ({
                id: item.id,
                description: item.product_name,
                quantity: item.quantity ?? 0,
                rate: item.unit_price ?? 0,
              }))}
            />

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
  });

export default PurchaseDetailScreen;
