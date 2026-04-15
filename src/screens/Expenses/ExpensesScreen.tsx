import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { useQuery } from '@tanstack/react-query';
import { expensesService, Expense } from '../../supabase/expensesService';
import EmptyState from '../../components/EmptyState';
import ExpenseListSkeleton from '../../components/skeletons/ExpenseListSkeleton';
import FAB from '../../components/ui/FAB';
import AddExpenseSheet from '../../components/modals/AddExpenseSheet';
import {
  Wallet,
  AlertTriangle,
  Plus,
  CalendarDays,
  Tag,
  TrendingDown,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useOrganization } from '../../contexts/OrganizationContext';

const formatCurrency = (amount: number) =>
  `₹${(amount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const ExpensesScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation();
  const [isExpenseSheetVisible, setExpenseSheetVisible] = useState(false);

  const { organizationId } = useOrganization();

  const {
    data: expenses = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['expenses', 'list', organizationId],
    queryFn: () => expensesService.listExpenses(organizationId!),
    enabled: !!organizationId,
  });

  const total = useMemo(
    () => expenses.reduce((sum, exp) => sum + (exp.amount ?? 0), 0),
    [expenses],
  );

  const handleAddExpense = () => {
    setExpenseSheetVisible(true);
  };

  const handleExpenseSheetClose = () => {
    setExpenseSheetVisible(false);
    // Refetch expenses when modal closes to get updated data
    refetch();
  };

  const handleExpensePress = (expense: Expense) => {
    // Navigate to expense detail if needed
    // (navigation as any).navigate('ExpenseDetail', { expenseId: expense.id });
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Expenses</Text>
          <Text style={styles.subtitle}>Track your business expenses</Text>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
        </View>
      </View>
      {isLoading && !isRefetching ? (
        <ExpenseListSkeleton />
      ) : error ? (
        <EmptyState
          icon={<AlertTriangle color={tokens.destructive} size={32} />}
          title="Unable to load expenses"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList<Expense>
          data={expenses}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={tokens.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <EmptyState
              icon={<Wallet color={tokens.primary} size={32} />}
              title="No expenses yet"
              description="Start tracking your business expenses to better manage your finances."
              actionLabel="Add Expense"
              onAction={handleAddExpense}
            />
          )}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => handleExpensePress(item)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.description || 'Expense'}
                  </Text>
                  {item.party_name && (
                    <View style={styles.categoryBadge}>
                      <Tag color={tokens.primary} size={12} />
                      <Text style={styles.categoryText}>{item.party_name}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.amountBlock}>
                  <Text style={styles.cardAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.cardMetaRow}>
                  <CalendarDays color={tokens.mutedForeground} size={14} />
                  <Text style={styles.cardMeta}>
                    {new Date(item.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <TrendingDown color={tokens.destructive} size={14} />
              </View>
            </Pressable>
          )}
          contentContainerStyle={
            expenses.length === 0 ? styles.listEmpty : styles.listContent
          }
          style={styles.list}
        />
      )}

      <FAB
        label="Add Expense"
        icon={<Plus color="#fff" size={20} />}
        onPress={handleAddExpense}
        accessibilityLabel="Add expense"
      />

      <AddExpenseSheet
        visible={isExpenseSheetVisible}
        onClose={handleExpenseSheetClose}
      />
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: tokens.foreground,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: tokens.mutedForeground,
    },
    totalCard: {
      backgroundColor: tokens.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignItems: 'flex-end',
      minWidth: 120,
    },
    totalLabel: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginBottom: 4,
      fontWeight: '600',
    },
    totalAmount: {
      fontSize: 20,
      fontWeight: '700',
      color: tokens.destructive,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    listEmpty: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    separator: {
      height: 14,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: 18,
      marginBottom: 14,
    },
    cardPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.99 }],
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    cardTitleBlock: {
      flex: 1,
      paddingRight: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
      marginBottom: 8,
      lineHeight: 22,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: tokens.primaryAlpha15,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      gap: 6,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: '600',
      color: tokens.primary,
    },
    amountBlock: {
      alignItems: 'flex-end',
    },
    cardAmount: {
      fontSize: 20,
      fontWeight: '700',
      color: tokens.destructive,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
    },
    cardMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardMeta: {
      fontSize: 12,
      color: tokens.mutedForeground,
      fontWeight: '500',
    },
  });

export default ExpensesScreen;
