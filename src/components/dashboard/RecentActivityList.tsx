import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import InvoiceCard from '../InvoiceCard';
import { ShoppingBag } from 'lucide-react-native';
import type { AppNavigationParamList } from '../../navigation/types';

// Reuse the type definition or import it if it were shared
export type CashSummary = {
  id: string;
  title: string;
  total: number;
  balance: number;
  status: 'paid' | 'pending';
  reference: string;
  date: string;
};

interface RecentActivityListProps {
  activities: CashSummary[];
}

const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
}) => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Pressable onPress={() => navigation.navigate('InvoicesTab')}>
          <Text style={styles.sectionLink}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.listContainer}>
        {activities.length > 0 ? (
          activities.map(entry => (
            <InvoiceCard
              key={entry.id}
              variant="compact"
              showActions={false}
              invoice={{
                id: entry.id,
                clientName: entry.title,
                invoiceNumber: entry.reference,
                date: entry.date,
                amount: entry.total,
                balance: entry.balance,
                status: entry.status,
              }}
              onPress={() =>
                navigation.navigate('InvoicesTab', {
                  screen: 'InvoiceDetail',
                  params: {
                    invoiceId: entry.id,
                    invoice: {
                      id: entry.id,
                      invoiceNumber: entry.reference,
                      clientName: entry.title,
                      date: entry.date,
                      amount: entry.total,
                      status: entry.status,
                    },
                  },
                })
              }
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <ShoppingBag size={48} color={tokens.mutedForeground} />
            <Text style={styles.emptyStateText}>No recent transactions</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first invoice to get started!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 16,
    },
    sectionTitle: {
      color: tokens.foreground,
      fontWeight: '700',
      fontSize: 18,
    },
    sectionLink: {
      color: tokens.primary,
      fontWeight: '600',
      fontSize: 14,
    },
    listContainer: {
      gap: 12,
    },
    emptyState: {
      alignItems: 'center',
      padding: 24,
      backgroundColor: tokens.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: tokens.border,
      borderStyle: 'dashed',
    },
    emptyStateText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
    },
    emptyStateSubtext: {
      marginTop: 4,
      fontSize: 14,
      color: tokens.mutedForeground,
      textAlign: 'center',
    },
  });

export default RecentActivityList;
