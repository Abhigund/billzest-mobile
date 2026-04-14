import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Plus,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { useParties } from '../../hooks/useParties';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { expensesService } from '../../supabase/expensesService';
import { supabase } from '../../supabase/supabaseClient';
import EmptyState from '../../components/EmptyState';
import CreditBookSkeleton from '../../components/skeletons/CreditBookSkeleton';
import RecordPaymentSheet from '../../components/modals/RecordPaymentSheet';
import { Banknote } from 'lucide-react-native';
import { Party } from '../../types/domain';
import type { AppNavigationParamList } from '../../navigation/types';

const CreditBookScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();

  const [activeTab, setActiveTab] = useState<'customer' | 'vendor' | 'expense'>(
    'customer',
  );
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [selectedPartyForPayment, setSelectedPartyForPayment] =
    useState<Party | null>(null);

  // Fetch real parties data
  const {
    data: allParties = [],
    isLoading: partiesLoading,
    error: partiesError,
    refetch: refetchParties,
  } = useParties();

  const { organizationId } = useOrganization();

  // Fetch expenses total
  const { data: totalExpenses = 0, error: expensesError } = useQuery({
    queryKey: ['expenses', 'total', organizationId],
    queryFn: async () => {
      if (!organizationId) return 0;
      return expensesService.getTotalExpenses(organizationId);
    },
    enabled: !!organizationId,
  });

  // Calculate balances from orders
  const { data: partiesWithCalculatedBalances = [] } = useQuery({
    queryKey: ['parties', 'with-balances', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // V2: Orders track total_amount and received_amount directly
      const { data: orders } = await supabase
        .from('orders')
        .select(
          'id, party_id, total_amount, received_amount, status, is_cancelled',
        )
        .eq('organization_id', organizationId)
        .eq('is_cancelled', false);

      const orderRows = orders ?? [];

      // Calculate outstanding per party
      const balanceByParty = new Map<string, number>();
      orderRows.forEach(ord => {
        if (ord.status === 'cancelled') return;
        const total = ord.total_amount ?? 0;
        const received = (ord as any).received_amount ?? 0;
        const outstanding = Math.max(0, total - received);
        const current = balanceByParty.get(ord.party_id) ?? 0;
        balanceByParty.set(ord.party_id, current + outstanding);
      });

      // Map parties with calculated balances
      return (allParties ?? []).map(party => {
        if (party.party_type === 'customer') {
          return { ...party, balance: balanceByParty.get(party.id) ?? 0 };
        }
        return { ...party, balance: party.balance ?? 0 };
      });
    },
    enabled: allParties.length > 0 && !!organizationId,
  });

  const filteredParties = partiesWithCalculatedBalances.filter(
    p => p.party_type === activeTab,
  );

  // Calculate totals from real data
  const totalReceivable = useMemo(() => {
    return partiesWithCalculatedBalances
      .filter(p => p.party_type === 'customer')
      .reduce((sum, p) => sum + (p.balance ?? 0), 0);
  }, [partiesWithCalculatedBalances]);

  const totalPayable = useMemo(() => {
    return partiesWithCalculatedBalances
      .filter(p => p.party_type === 'vendor')
      .reduce((sum, p) => sum + (p.balance ?? 0), 0);
  }, [partiesWithCalculatedBalances]);

  const handleAddParty = () => {
    navigation.navigate('AddPartySheet');
  };

  const handlePartyPress = (party: any) => {
    navigation.navigate('PartyLedgerScreen', { party });
  };

  const handleRecordPayment = (party: Party) => {
    setSelectedPartyForPayment(party);
    setPaymentSheetVisible(true);
  };

  const handleClosePaymentSheet = () => {
    setPaymentSheetVisible(false);
    setSelectedPartyForPayment(null);
    // Refresh data after payment
    refetchParties();
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* ACTION HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Credit Book</Text>
            <Text style={styles.headerSubtitle}>Manage your Khata</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddParty}>
            <Plus color="white" size={20} />
            <Text style={styles.addButtonText}>Party</Text>
          </TouchableOpacity>
        </View>

        {/* SUMMARY CARDS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.summaryRow}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          <View style={[styles.summaryCard, { borderColor: tokens.primary }]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Receivable</Text>
              <TrendingUp size={16} color={tokens.primary} />
            </View>
            <Text style={[styles.summaryValue, { color: tokens.primary }]}>
              ₹{totalReceivable.toLocaleString('en-IN')}
            </Text>
          </View>

          <View
            style={[styles.summaryCard, { borderColor: tokens.destructive }]}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Payable</Text>
              <TrendingDown size={16} color={tokens.destructive} />
            </View>
            <Text style={[styles.summaryValue, { color: tokens.destructive }]}>
              ₹{totalPayable.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.summaryCard, { borderColor: 'orange' }]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Wallet size={16} color="orange" />
            </View>
            <Text style={[styles.summaryValue, { color: 'orange' }]}>
              ₹{totalExpenses.toLocaleString('en-IN')}
            </Text>
          </View>
        </ScrollView>

        {/* TABS */}
        <View style={styles.tabRow}>
          <Pressable
            style={[
              styles.tabChip,
              activeTab === 'customer' && styles.tabChipActive,
            ]}
            onPress={() => setActiveTab('customer')}
          >
            <Users
              color={
                activeTab === 'customer'
                  ? tokens.primaryForeground
                  : tokens.mutedForeground
              }
              size={16}
            />
            <Text
              style={[
                styles.tabChipText,
                activeTab === 'customer' && styles.tabChipTextActive,
              ]}
            >
              Customers
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabChip,
              activeTab === 'vendor' && styles.tabChipActive,
            ]}
            onPress={() => setActiveTab('vendor')}
          >
            <Users
              color={
                activeTab === 'vendor'
                  ? tokens.primaryForeground
                  : tokens.mutedForeground
              }
              size={16}
            />
            <Text
              style={[
                styles.tabChipText,
                activeTab === 'vendor' && styles.tabChipTextActive,
              ]}
            >
              Vendors
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabChip,
              activeTab === 'expense' && styles.tabChipActive,
            ]}
            onPress={() => setActiveTab('expense')}
          >
            <Wallet
              color={
                activeTab === 'expense'
                  ? tokens.primaryForeground
                  : tokens.mutedForeground
              }
              size={16}
            />
            <Text
              style={[
                styles.tabChipText,
                activeTab === 'expense' && styles.tabChipTextActive,
              ]}
            >
              Expenses
            </Text>
          </Pressable>
        </View>

        {/* LIST */}
        <View style={styles.listSection}>
          {partiesLoading ? (
            <CreditBookSkeleton />
          ) : partiesError && !partiesLoading ? (
            <EmptyState
              icon={<AlertTriangle color={tokens.destructive} size={32} />}
              title="Unable to load credit book"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={() => refetchParties()}
            />
          ) : !partiesLoading &&
            !partiesError &&
            filteredParties.length === 0 ? (
            <EmptyState
              icon={
                activeTab === 'customer' ? (
                  <Users color={tokens.primary} size={32} />
                ) : activeTab === 'vendor' ? (
                  <Users color={tokens.primary} size={32} />
                ) : (
                  <Wallet color={tokens.primary} size={32} />
                )
              }
              title={`No ${
                activeTab === 'customer'
                  ? 'customers'
                  : activeTab === 'vendor'
                  ? 'vendors'
                  : 'expenses'
              } yet`}
              description={
                activeTab === 'customer'
                  ? 'Add customers to start tracking receivables.'
                  : activeTab === 'vendor'
                  ? 'Add vendors to start tracking payables.'
                  : 'Add expenses to track your business spending.'
              }
              actionLabel={`Add ${
                activeTab === 'customer'
                  ? 'Customer'
                  : activeTab === 'vendor'
                  ? 'Vendor'
                  : 'Expense'
              }`}
              onAction={handleAddParty}
            />
          ) : (
            filteredParties.map(party => (
              <View key={party.id} style={styles.partyCardWrapper}>
                <TouchableOpacity
                  style={styles.partyCard}
                  onPress={() => handlePartyPress(party)}
                >
                  <View style={styles.partyInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {party.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.partyName}>{party.name}</Text>
                      {party.mobile ? (
                        <Text style={styles.partyMobile}>{party.mobile}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.partyBalance}>
                    <Text
                      style={[
                        styles.balanceText,
                        activeTab === 'customer'
                          ? { color: tokens.primary }
                          : { color: tokens.destructive },
                        // Generally: Customer Positive = Receivable (Green), Vendor Positive = Payable (Red)
                        // For Expense -> Red/Orange
                        // Using simplistic logic for now
                      ]}
                    >
                      ₹{party.balance.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.balanceLabelSmall}>
                      {activeTab === 'customer'
                        ? 'You get'
                        : activeTab === 'vendor'
                        ? 'You give'
                        : 'Spent'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {activeTab === 'customer' && party.balance > 0 && (
                  <Pressable
                    style={styles.paymentButton}
                    onPress={() => handleRecordPayment(party)}
                  >
                    <Banknote color={tokens.primaryForeground} size={16} />
                    <Text style={styles.paymentButtonText}>Pay</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Payment Recording Sheet */}
      <RecordPaymentSheet
        visible={paymentSheetVisible}
        onClose={handleClosePaymentSheet}
        party={selectedPartyForPayment}
        outstandingAmount={selectedPartyForPayment?.balance}
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
      paddingBottom: 100,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: tokens.foreground,
    },
    headerSubtitle: {
      color: tokens.mutedForeground,
      fontSize: 14,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 6,
    },
    addButtonText: {
      color: tokens.primaryForeground,
      fontWeight: '600',
    },
    summaryRow: {
      flexDirection: 'row',
      marginBottom: 24,
      marginHorizontal: -4,
    },
    summaryCard: {
      width: 160,
      padding: 16,
      backgroundColor: tokens.card,
      borderRadius: 16,
      borderWidth: 1,
      marginRight: 12,
      justifyContent: 'space-between',
      height: 100,
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: tokens.mutedForeground,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
    },
    tabRow: {
      flexDirection: 'row',
      marginBottom: 18,
    },
    tabChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 12,
      backgroundColor: tokens.card,
    },
    tabChipActive: {
      backgroundColor: tokens.primary,
      borderColor: tokens.primary,
    },
    tabChipText: {
      marginLeft: 8,
      color: tokens.mutedForeground,
      fontWeight: '600',
    },
    tabChipTextActive: {
      color: tokens.primaryForeground,
    },
    listSection: {
      marginBottom: 20,
    },
    partyCardWrapper: {
      marginBottom: 12,
      position: 'relative',
    },
    partyCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: tokens.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    partyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: tokens.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '600',
      color: tokens.mutedForeground,
    },
    partyName: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.foreground,
    },
    partyMobile: {
      fontSize: 13,
      color: tokens.mutedForeground,
    },
    partyBalance: {
      alignItems: 'flex-end',
    },
    balanceText: {
      fontSize: 16,
      fontWeight: '700',
    },
    balanceLabelSmall: {
      fontSize: 11,
      color: tokens.mutedForeground,
    },
    paymentButton: {
      marginTop: 8,
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: tokens.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    paymentButtonText: {
      color: tokens.primaryForeground,
      fontSize: 12,
      fontWeight: '600',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      color: tokens.mutedForeground,
      marginBottom: 8,
    },
    emptyStateLink: {
      color: tokens.primary,
      fontWeight: '600',
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabContainer: {
      position: 'absolute',
      bottom: 20,
      right: 20,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: tokens.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  });

export default CreditBookScreen;
