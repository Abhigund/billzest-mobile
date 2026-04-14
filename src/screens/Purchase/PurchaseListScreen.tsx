import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenWrapper from '../../components/ScreenWrapper';
import FAB from '../../components/ui/FAB';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { Truck, CalendarDays, Package, AlertTriangle } from 'lucide-react-native';
import EmptyState from '../../components/EmptyState';
import PurchaseListSkeleton from '../../components/skeletons/PurchaseListSkeleton';
import { usePurchases } from '../../logic/purchaseLogic';
import StatusBadge, { StatusType } from '../../components/ui/StatusBadge';
import type { PurchaseStackParamList } from '../../navigation/types';

const STATUS_FILTERS = ['All', 'Pending', 'Received', 'Draft'];

const PurchaseListScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation =
    useNavigation<NativeStackNavigationProp<PurchaseStackParamList>>();
  const [selectedStatus, setSelectedStatus] = useState(STATUS_FILTERS[0]);

  const {
    data: purchases = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = usePurchases(undefined, selectedStatus);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const filteredPurchases = useMemo(() => {
    if (selectedStatus === 'All') return purchases;
    return (purchases || []).filter(
      purchase => purchase.status?.toLowerCase() === selectedStatus.toLowerCase(),
    );
  }, [selectedStatus, purchases]);

  const pendingTotal = useMemo(
    () =>
      (purchases || [])
        .filter(p => p.status?.toLowerCase() === 'pending')
        .reduce((sum, p) => sum + (p.total_amount ?? 0), 0),
    [purchases],
  );

  const receivedTotal = useMemo(
    () =>
      (purchases || [])
        .filter(p => p.status?.toLowerCase() === 'received')
        .reduce((sum, p) => sum + (p.total_amount ?? 0), 0),
    [purchases],
  );

  const navigateToDetail = (purchase: any) => {
    navigation.navigate('PurchaseDetail', {
      purchaseId: purchase.id,
      purchase,
    });
  };

  const handleNewPurchase = () => {
    navigation.navigate('PurchaseCreate', {});
  };

  const getPurchaseStatusType = (status?: string | null): StatusType => {
    if (!status) return 'neutral';
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'received') return 'success';
    if (s === 'pending') return 'warning';
    if (s === 'draft') return 'neutral';
    return 'neutral';
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={tokens.primary}
          />
        }
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending Stock</Text>
            <Text style={styles.summaryValue}>{formatCurrency(pendingTotal)}</Text>
            <Text style={styles.summaryMeta}>
              {(purchases || []).filter(p => p.status?.toLowerCase() === 'pending').length} open POs
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Received this week</Text>
            <Text style={styles.summaryValue}>{formatCurrency(receivedTotal)}</Text>
            <Text style={styles.summaryMeta}>
              {(purchases || []).filter(p => p.status?.toLowerCase() === 'received').length} shipments
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {STATUS_FILTERS.map(filter => {
            const isActive = filter === selectedStatus;
            return (
              <Pressable
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedStatus(filter)}
              >
                <Text
                  style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.listSection}>
          {isLoading && filteredPurchases.length === 0 ? (
            <PurchaseListSkeleton />
          ) : null}

          {error ? (
            <EmptyState
              icon={<AlertTriangle color={tokens.primary} size={28} />}
              title="Couldn’t load purchases"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={refetch}
            />
          ) : null}

          {!isLoading && !error && filteredPurchases.length === 0 ? (
            <EmptyState
              icon={<Package color={tokens.primary} size={28} />}
              title="No purchases yet"
              description="Create your first purchase order to restock inventory."
              actionLabel="Create purchase"
              onAction={handleNewPurchase}
            />
          ) : null}

          {filteredPurchases.map(purchase => (
            <Pressable
              key={purchase.id}
              style={styles.purchaseCard}
              onPress={() => navigateToDetail(purchase)}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardSupplier}>
                    {purchase.vendor_name ?? 'Unknown Vendor'}
                  </Text>
                  <Text style={styles.cardMeta}>{purchase.vendor_phone ?? '—'}</Text>
                </View>
                <StatusBadge
                  status={getPurchaseStatusType(purchase.status)}
                  label={
                    purchase.status
                      ? purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)
                      : 'Draft'
                  }
                  variant="subtle"
                  size="sm"
                />
              </View>
              <View style={styles.cardInfoRow}>
                <View style={styles.infoItem}>
                  <Truck color={tokens.primary} size={18} />
                  <Text style={styles.infoText}>{purchase.order_number ?? '—'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <CalendarDays color={tokens.primary} size={18} />
                  <Text style={styles.infoText}>
                    {purchase.order_date
                      ? new Date(purchase.order_date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: '2-digit',
                        })
                      : 'No ETA'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardAmount}>{formatCurrency(purchase.total_amount ?? 0)}</Text>
                  <Text style={styles.cardMeta}>
                    {purchase.purchase_order_items?.length ?? 0} line items
                  </Text>
                </View>
                <Text style={styles.cardMeta}>
                  Updated{' '}
                  {purchase.updated_at
                    ? new Date(purchase.updated_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })
                    : '—'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <FAB
        label="New Purchase"
        icon={<Package color="#fff" size={20} />}
        onPress={handleNewPurchase}
        accessibilityLabel="Create purchase"
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
      paddingBottom: 140,
    },
    summaryRow: {
      flexDirection: 'row',
      marginHorizontal: -6,
      marginBottom: 16,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: 16,
      marginHorizontal: 6,
    },
    summaryLabel: {
      color: tokens.mutedForeground,
      marginBottom: 6,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: tokens.foreground,
    },
    summaryMeta: {
      color: tokens.mutedForeground,
      marginTop: 4,
    },
    filterScroll: {
      marginBottom: 14,
    },
    filterContent: {
      paddingRight: 20,
    },
    filterChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 10,
    },
    filterChipActive: {
      backgroundColor: tokens.primary,
      borderColor: tokens.primary,
    },
    filterChipText: {
      color: tokens.foreground,
      fontWeight: '600',
    },
    filterChipTextActive: {
      color: tokens.primaryForeground,
    },
    listSection: {
      marginTop: 4,
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
    purchaseCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: 18,
      marginBottom: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardSupplier: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
    },
    cardMeta: {
      color: tokens.mutedForeground,
      marginTop: 4,
    },
    cardInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoText: {
      marginLeft: 8,
      color: tokens.mutedForeground,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardAmount: {
      fontSize: 20,
      fontWeight: '700',
      color: tokens.foreground,
    },
  });

export default PurchaseListScreen;
