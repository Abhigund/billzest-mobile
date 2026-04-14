import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  FlatList,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Share,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import InvoiceCard from '../../components/InvoiceCard';
import QuickLinksCard from '../../components/QuickLinksCard';
import SearchBar from '../../components/SearchBar';
import ScreenWrapper from '../../components/ScreenWrapper';
import FAB from '../../components/ui/FAB';
import EmptyState from '../../components/EmptyState';
import InvoiceListSkeleton from '../../components/skeletons/InvoiceListSkeleton';
import { useOrders } from '../../logic/orderLogic';
import InvoiceFilterSheet, {
  InvoiceFilters,
} from '../../components/modals/InvoiceFilterSheet';
import { useAppSettingsStore } from '../../stores/appSettingsStore';
import {
  FilePlus,
  Share2,
  Banknote,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Eye,
  CreditCard,
  Plus,
  FileText,
} from 'lucide-react-native';
import type { AppNavigationParamList } from '../../navigation/types';

const STATUS_FILTERS = ['All', 'Paid', 'Sent', 'Overdue', 'Draft'];
const INVOICES_PAGE_SIZE = 20;

const InvoicesListScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(STATUS_FILTERS[0]);
  const [isFilterSheetVisible, setFilterSheetVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<InvoiceFilters>({});
  const [visibleCount, setVisibleCount] = useState(INVOICES_PAGE_SIZE);
  const { simplifiedPOSEnabled } = useAppSettingsStore();
  const {
    data: invoices = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useOrders(searchTerm, selectedStatus);

  const kpis = useMemo(() => {
    const paid = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);
    const pending = invoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);
    return [
      {
        id: 'due',
        label: 'Pending Amount',
        value: `₹${pending.toLocaleString('en-IN')}`,
      },
      { id: 'paid', label: 'Paid', value: `₹${paid.toLocaleString('en-IN')}` },
      { id: 'counts', label: 'Invoices', value: `${invoices.length} Total` },
    ];
  }, [invoices]);

  useEffect(() => {
    setVisibleCount(INVOICES_PAGE_SIZE);
  }, [searchTerm, selectedStatus, invoices.length]);

  const visibleInvoices = useMemo(
    () => invoices.slice(0, visibleCount),
    [invoices, visibleCount],
  );

  const hasMoreInvoices = visibleCount < invoices.length;

  const handleLoadMore = useCallback(() => {
    if (isLoading || isRefetching || !hasMoreInvoices) {
      return;
    }

    setVisibleCount(current => Math.min(current + INVOICES_PAGE_SIZE, invoices.length));
  }, [hasMoreInvoices, invoices.length, isLoading, isRefetching]);

  const handleShareInvoice = useCallback(async (orderId: string) => {
    try {
      // Fetch full order data
      const { ordersService } = await import('../../supabase/ordersService');
      const fullInvoice = await ordersService.getOrderById(orderId);

      if (!fullInvoice) {
        Alert.alert('Error', 'Invoice not found.');
        return;
      }

      // Use PDF service to share
      const { pdfService } = await import('../../services/pdfService');
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
  }, []);

  const handlePayment = useCallback(
    (orderId: string, invoice: (typeof invoices)[number]) => {
      navigation.navigate('InvoiceDetail', {
        orderId,
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          client_name: invoice.party?.name ?? 'Customer',
          created_at: invoice.created_at,
          status: invoice.status,
          subtotal: invoice.subtotal,
          tax_amount: invoice.tax_amount ?? 0,
          total_amount: invoice.total_amount,
        },
      });
    },
    [navigation, invoices],
  );

  const handleQuickLinkPress = useCallback(
    (id: string) => {
      switch (id) {
        case 'create':
          if (simplifiedPOSEnabled) {
            navigation.navigate('SimplifiedPOS');
          } else {
            navigation.navigate('AddSale');
          }
          break;
        case 'share':
          // Share functionality should be called from individual invoice cards
          Alert.alert('Info', 'Select an invoice to share it.');
          break;
        case 'collect':
          // Payment collection should be called from individual invoice cards
          Alert.alert('Info', 'Select an invoice to collect payment.');
          break;
        case 'more':
          Alert.alert('Show All', 'Showing all invoices.');
          break;
        default:
          break;
      }
    },
    [navigation],
  );

  const handleOpenFilters = useCallback(() => {
    setFilterSheetVisible(true);
  }, []);

  const handleApplyFilters = useCallback((filters: InvoiceFilters) => {
    setActiveFilters(filters);
    // Apply status filter if provided
    if (filters.status) {
      const statusMap: Record<string, string> = {
        draft: 'Draft',
        sent: 'Sent',
        paid: 'Paid',
        overdue: 'Overdue',
        cancelled: 'Cancelled',
      };
      const statusLabel = statusMap[filters.status] || 'All';
      setSelectedStatus(statusLabel);
    }
  }, []);

  return (
    <ScreenWrapper>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[tokens.primary]}
            tintColor={tokens.primary}
          />
        }
        data={visibleInvoices}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.summaryRow}>
              {kpis.map(card => (
                <View key={card.id} style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>{card.label}</Text>
                  <Text style={styles.summaryValue}>{card.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>View Reports</Text>
                <Text style={styles.heroSubtitle}>
                  Send branded invoices, collect payments, and reconcile faster.
                </Text>
              </View>
              <Pressable
                style={styles.heroButton}
                onPress={() => navigation.navigate('Reports')}
              >
                <Text style={styles.heroButtonText}>See Reports</Text>
              </Pressable>
            </View>

            <QuickLinksCard
              items={[
                {
                  id: 'create',
                  label: 'Create Invoice',
                  icon: <FilePlus color={tokens.primary} size={24} />,
                  onPress: () => handleQuickLinkPress('create'),
                },
                {
                  id: 'share',
                  label: 'Share PDF',
                  icon: <Share2 color={tokens.primary} size={24} />,
                  onPress: () => handleQuickLinkPress('share'),
                },
                {
                  id: 'collect',
                  label: 'Collect Payment',
                  icon: <Banknote color={tokens.primary} size={24} />,
                  onPress: () => handleQuickLinkPress('collect'),
                },
                {
                  id: 'more',
                  label: 'Show All',
                  icon: <MoreHorizontal color={tokens.primary} size={24} />,
                  onPress: () => handleQuickLinkPress('more'),
                },
              ]}
            />

            <SearchBar
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search invoice"
              showFilter={true}
              onFilterPress={handleOpenFilters}
              filterActive={Object.keys(activeFilters).length > 0}
              trailingActions={
                <Pressable
                  style={styles.roundedIconButton}
                  onPress={() => Alert.alert('Sort', 'Sort options')}
                >
                  <ArrowUpDown color={tokens.foreground} size={20} />
                </Pressable>
              }
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filtersContent}
            >
              {STATUS_FILTERS.map(status => {
                const active = status === selectedStatus;
                return (
                  <Pressable
                    key={status}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          isLoading && !isRefetching ? (
            <InvoiceListSkeleton />
          ) : error ? (
            <EmptyState
              icon={<FileText color={tokens.primary} size={28} />}
              title="Unable to load invoices"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={refetch}
            />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<FilePlus color={tokens.primary} size={28} />}
              title="No invoices yet"
              description="Create your first invoice to see it here."
              actionLabel="New Invoice"
              onAction={() =>
                simplifiedPOSEnabled
                  ? navigation.navigate('SimplifiedPOS')
                  : navigation.navigate('AddSale')
              }
            />
          ) : null
        }
        renderItem={({ item: invoice }) => {
          const clientName = invoice.party?.name || 'Customer';
          return (
            <InvoiceCard
              invoice={{
                id: invoice.id,
                invoiceNumber: invoice.invoice_number,
                clientName,
                date: invoice.created_at || new Date().toISOString(),
                dueDate: invoice.created_at || new Date().toISOString(),
                amount: invoice.total_amount,
                status: invoice.status,
              }}
              onPress={() =>
                navigation.navigate('InvoiceDetail', {
                  orderId: invoice.id,
                  invoice,
                })
              }
              onShare={() => handleShareInvoice(invoice.invoice_number)}
              onPayment={() => handlePayment(invoice.id, invoice)}
            />
          );
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          <View style={styles.footerSpacer}>
            {hasMoreInvoices ? (
              <ActivityIndicator color={tokens.primary} size="small" />
            ) : null}
          </View>
        }
      />

      <InvoiceFilterSheet
        visible={isFilterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
      />

      <FAB
        label="New Invoice"
        icon={<Plus color="#fff" size={24} />}
        onPress={() =>
          simplifiedPOSEnabled
            ? navigation.navigate('SimplifiedPOS')
            : navigation.navigate('AddSale')
        }
        accessibilityLabel="Create new invoice"
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
      paddingBottom: 120,
    },
    summaryRow: {
      flexDirection: 'row',
      marginHorizontal: -6,
      marginBottom: 18,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: tokens.card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      marginHorizontal: 6,
    },
    summaryLabel: {
      color: tokens.mutedForeground,
      marginBottom: 8,
    },
    summaryValue: {
      color: tokens.foreground,
      fontWeight: '700',
      fontSize: 18,
    },
    heroCard: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },
    heroContent: {
      flex: 1,
      paddingRight: 12,
    },
    heroTitle: {
      color: tokens.foreground,
      fontWeight: '700',
      fontSize: 16,
    },
    heroSubtitle: {
      color: tokens.mutedForeground,
      marginTop: 6,
    },
    heroButton: {
      backgroundColor: tokens.primary,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    heroButtonText: {
      color: tokens.primaryForeground,
      fontWeight: '600',
    },

    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    searchField: {
      flex: 1,
      marginRight: 10,
    },
    searchInput: {
      backgroundColor: tokens.card,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      color: tokens.foreground,
    },
    roundedIconButton: {
      width: 60,
      height: 52,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.card,
      marginLeft: 6,
    },
    roundedIconButtonActive: {
      borderColor: tokens.primary,
      backgroundColor: tokens.card,
      opacity: 0.9,
    },
    roundedIconLabel: {
      color: tokens.foreground,
      fontWeight: '600',
      fontSize: 12,
    },
    filterScroll: {
      marginBottom: 18,
    },
    filtersContent: {
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
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: tokens.primaryForeground,
    },
    invoiceList: {
      marginBottom: 4,
    },
    fabText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
    footerSpacer: {
      height: 32,
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 32,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.primary,
      borderRadius: 999,
      paddingHorizontal: 20,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 6,
    },
    fabIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    fabIconText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 18,
    },
  });

export default InvoicesListScreen;
