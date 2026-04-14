import React, { useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import CustomerCard, { Customer } from '../../components/CustomerCard';
// AddPartySheet removed for CustomerFormScreen
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import CustomerListSkeleton from '../../components/skeletons/CustomerListSkeleton';
import FAB from '../../components/ui/FAB';
import { Linking, Share, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useClients } from '../../logic/partyLogic';
import { Party } from '../../types/domain';
import { supabase } from '../../supabase/supabaseClient';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CustomersStackParamList } from '../../navigation/types';
import {
  Phone,
  MessageSquare,
  Share2,
  Filter,
  ArrowUpDown,
  Plus,
  Users,
} from 'lucide-react-native';

const CUSTOMER_SEGMENTS = [
  'All Parties',
  'Customers',
  'Suppliers',
  'Credit',
  'Overdue',
];

// QUICK_LINKS definition removed - using component props

const formatMetricCurrency = (value: number): string =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;




const CustomersListScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState(CUSTOMER_SEGMENTS[0]);
  const [addPartySheetVisible, setAddPartySheetVisible] = useState(false);
  const { organizationId } = useOrganization();

  const {
    data: parties = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useClients();

  // Calculate outstanding balances from orders
  const { data: partiesWithBalances = [] } = useQuery({
    queryKey: ['parties', 'with-outstanding-balances'],
    queryFn: async () => {
      if (!organizationId || parties.length === 0) return parties;

      // V2: Orders track total_amount and received_amount directly
      const { data: orders } = await supabase
        .from('orders')
        .select(
          'id, party_id, total_amount, received_amount, status, is_cancelled, created_at',
        )
        .eq('organization_id', organizationId)
        .eq('is_cancelled', false);

      const orderRows = orders ?? [];

      // Calculate outstanding and total sale per party
      const balanceByParty = new Map<
        string,
        { outstanding: number; totalSale: number; lastOrder: Date | null }
      >();
      orderRows.forEach(ord => {
        if (ord.status === 'cancelled') return;
        const total = ord.total_amount ?? 0;
        const received = (ord as any).received_amount ?? 0;
        const outstanding = Math.max(0, total - received);
        const lastOrder = ord.created_at ? new Date(ord.created_at) : null;

        const existing = balanceByParty.get(ord.party_id);
        balanceByParty.set(ord.party_id, {
          outstanding: (existing?.outstanding ?? 0) + outstanding,
          totalSale: (existing?.totalSale ?? 0) + total,
          lastOrder:
            existing?.lastOrder && lastOrder
              ? existing.lastOrder > lastOrder
                ? existing.lastOrder
                : lastOrder
              : lastOrder || existing?.lastOrder || null,
        });
      });

      return parties.map(party => {
        const balanceData = balanceByParty.get(party.id);
        return {
          ...party,
          calculatedBalance: balanceData?.outstanding ?? 0,
          totalSale: balanceData?.totalSale ?? 0,
          lastInvoiceDate: balanceData?.lastOrder ?? null,
        };
      });
    },
    enabled: parties.length > 0 && !!organizationId,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const normalizedCustomers: Customer[] = useMemo(() => {
    const toCustomerCard = (party: any): Customer => {
      const outstanding = party.calculatedBalance ?? party.balance ?? 0;
      const totalSale = party.totalSale ?? 0;
      const lastInvoiceDate = party.lastInvoiceDate || party.updated_at;

      return {
        id: party.id,
        name: party.name ?? 'Untitled Party',
        businessType: party.party_type === 'vendor' ? 'Supplier' : 'Customer',
        location: party.address ?? '—',
        dueAmount: outstanding,
        totalSale: totalSale,
        lastInvoice: lastInvoiceDate
          ? new Date(lastInvoiceDate).toLocaleDateString('en-IN', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })
          : '—',
        status:
          outstanding > 0 ? (outstanding > 10000 ? 'overdue' : 'due') : 'clear',
        phone: party.phone || party.mobile || 'N/A',
      };
    };

    return partiesWithBalances.map(toCustomerCard);
  }, [partiesWithBalances]);

  const handlePhonePress = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleMessagePress = useCallback((phone: string) => {
    Linking.openURL(`sms:${phone}`);
  }, []);

  const handleSharePress = useCallback(async (customer: Customer) => {
    try {
      await Share.share({
        message: `Customer Details:\nName: ${customer.name}\nPhone: ${customer.phone}\nDue: ₹${customer.dueAmount}`,
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const filteredCustomers = useMemo(() => {
    return normalizedCustomers.filter(customer => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.businessType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSegment = (() => {
        if (selectedSegment === 'All Parties') return true;
        if (selectedSegment === 'Customers')
          return customer.businessType === 'Customer';
        if (selectedSegment === 'Suppliers')
          return customer.businessType === 'Supplier';
        if (selectedSegment === 'Credit') return customer.dueAmount > 0;
        if (selectedSegment === 'Overdue') return customer.status === 'overdue';
        return true;
      })();

      return matchesSearch && matchesSegment;
    });
  }, [searchTerm, selectedSegment, normalizedCustomers]);

  const renderCustomerNode = useCallback(
    (customer: Customer) => {
      return (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onPress={() =>
            navigation.navigate('CustomerDetail', {
              customerId: customer.id,
            })
          }
          onPhonePress={() => handlePhonePress(customer.phone)}
          onMessagePress={() => handleMessagePress(customer.phone)}
          onSharePress={() => handleSharePress(customer)}
        />
      );
    },
    [navigation, handlePhonePress, handleMessagePress, handleSharePress]
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isRefetching}
            onRefresh={onRefresh}
            colors={[tokens.primary]}
            tintColor={tokens.primary}
          />
        }
      >
        <View style={styles.summaryRow}>
          {[
            {
              id: 'parties',
              label: 'Total Parties',
              value: String(partiesWithBalances.length),
            },
            {
              id: 'receivable',
              label: "You'll Get",
              value: formatMetricCurrency(
                partiesWithBalances
                  .filter(
                    (p: any) =>
                      (p.calculatedBalance ?? 0) > 0 &&
                      p.businessType === 'Customer',
                  )
                  .reduce(
                    (sum: number, p: any) => sum + (p.calculatedBalance ?? 0),
                    0,
                  ),
              ),
            },
            {
              id: 'payable',
              label: "You'll Give",
              value: formatMetricCurrency(
                partiesWithBalances
                  .filter(
                    (p: any) =>
                      (p.calculatedBalance ?? 0) > 0 &&
                      p.businessType === 'Supplier',
                  )
                  .reduce(
                    (sum: number, p: any) => sum + (p.calculatedBalance ?? 0),
                    0,
                  ),
              ),
            },
          ].map(metric => (
            <View key={metric.id} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{metric.label}</Text>
              <Text style={styles.summaryValue}>{metric.value}</Text>
            </View>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {CUSTOMER_SEGMENTS.map(segment => {
            const isActive = selectedSegment === segment;
            return (
              <Pressable
                key={segment}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedSegment(segment)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {segment}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.customerList}>
          {isLoading && <CustomerListSkeleton />}

          {error && !isLoading && (
            <EmptyState
              icon={<Users color={tokens.destructive} size={32} />}
              title="Unable to load parties"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={refetch}
            />
          )}

          {!isLoading && !error && filteredCustomers.length === 0 && (
            <EmptyState
              icon={<Users color={tokens.primary} size={32} />}
              title="No parties found"
              description="Try adjusting your search, or add a new party to getting started."
              actionLabel="Add New Party"
              onAction={() => navigation.navigate('CustomerForm')}
            />
          )}
          {filteredCustomers.map(renderCustomerNode)}
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <FAB
        label="Add New Party"
        icon={<Plus color="#fff" size={24} />}
        onPress={() => navigation.navigate('CustomerForm')}
      />
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 120,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },
    headerBadge: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: tokens.card,
    },
    headerBadgeText: {
      color: tokens.foreground,
      fontWeight: '600',
    },
    summaryRow: {
      flexDirection: 'row',
      marginHorizontal: -6,
      marginBottom: 18,
    },
    summaryCard: {
      flex: 1,
      marginHorizontal: 6,
      backgroundColor: tokens.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border,
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
      fontSize: 15,
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
    roundedIconText: {
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
    customerList: {
      marginBottom: 4,
    },
    footerSpacer: {
      height: 30,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    loadingText: {
      marginLeft: 10,
      color: tokens.mutedForeground,
      fontSize: 15,
    },
  });

export default CustomersListScreen;
