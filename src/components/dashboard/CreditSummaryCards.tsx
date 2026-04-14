import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../supabase/supabaseClient';
import { useOrganization } from '../../contexts/OrganizationContext';
import type { AppNavigationParamList } from '../../navigation/types';

const formatCurrency = (value: number): string => {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const CreditSummaryCards: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const { organizationId } = useOrganization();

  // Fetch orders to calculate receivables and payables accurately
  const { data: creditSummary, isLoading } = useQuery({
    queryKey: ['creditSummary', 'dashboard', organizationId],
    queryFn: async () => {
      if (!organizationId) return { receivables: 0, payables: 0 };

      // V2: Use orders + parties to calculate outstanding balances
      const [ordersResult, partiesResult] = await Promise.all([
        supabase
          .from('orders')
          .select(
            'id, party_id, total_amount, received_amount, status, is_cancelled',
          )
          .eq('organization_id', organizationId)
          .eq('is_cancelled', false),
        supabase
          .from('parties')
          .select('id, type')
          .eq('organization_id', organizationId)
          .is('deleted_at', null),
      ]);

      const orders = ordersResult.data ?? [];
      const parties = partiesResult.data ?? [];

      // Create a map of party types
      const partyTypeMap = new Map<string, string>();
      parties.forEach(p => partyTypeMap.set(p.id, p.type));

      // Calculate outstanding balances per party from orders
      const balanceByParty = new Map<string, number>();
      orders.forEach(ord => {
        if (ord.status === 'cancelled') return;
        const total = ord.total_amount ?? 0;
        const received = (ord as any).received_amount ?? 0;
        const outstanding = Math.max(0, total - received);
        const current = balanceByParty.get(ord.party_id) ?? 0;
        balanceByParty.set(ord.party_id, current + outstanding);
      });

      let receivables = 0;
      let payables = 0;

      balanceByParty.forEach((balance, partyId) => {
        const partyType = partyTypeMap.get(partyId);
        if (
          partyType === 'CUSTOMER' ||
          partyType === 'customer' ||
          partyType === 'client'
        ) {
          receivables += balance;
        } else if (partyType === 'VENDOR' || partyType === 'vendor') {
          payables += balance;
        }
      });

      return { receivables, payables };
    },
    enabled: !!organizationId,
    staleTime: 1000 * 30,
  });

  const creditCards = useMemo(
    () => [
      {
        label: "You'll Get",
        value: creditSummary?.receivables ?? 0,
        type: 'positive' as const,
        route: 'CreditBook' as const,
      },
      {
        label: "You'll Give",
        value: creditSummary?.payables ?? 0,
        type: 'negative' as const,
        route: 'CreditBook' as const,
      },
    ],
    [creditSummary],
  );

  return (
    <View style={styles.creditRow}>
      {creditCards.map((item, index) => (
        <Pressable
          key={index}
          style={({ pressed }) => [
            styles.creditCard,
            item.type === 'positive'
              ? styles.cardPositive
              : styles.cardNegative,
            pressed && styles.pressed,
          ]}
          onPress={() => navigation.navigate(item.route)}
        >
          <View
            style={[
              styles.iconCircle,
              item.type === 'positive'
                ? styles.iconPositive
                : styles.iconNegative,
            ]}
          >
            {item.type === 'positive' ? (
              <ArrowDownLeft size={20} color={tokens.accent} />
            ) : (
              <ArrowUpRight size={20} color={tokens.destructive} />
            )}
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.creditLabel}>{item.label}</Text>
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={
                  item.type === 'positive' ? tokens.accent : tokens.destructive
                }
              />
            ) : (
              <Text
                style={[
                  styles.creditValue,
                  item.type === 'positive'
                    ? styles.textPositive
                    : styles.textNegative,
                ]}
              >
                {formatCurrency(item.value)}
              </Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    creditRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    creditCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      marginHorizontal: 6,
    },
    pressed: {
      opacity: 0.7,
    },
    cardPositive: {
      backgroundColor: tokens.card,
    },
    cardNegative: {
      backgroundColor: tokens.card,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    iconPositive: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    iconNegative: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    creditLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.mutedForeground,
      marginBottom: 4,
    },
    creditValue: {
      fontSize: 18,
      fontWeight: '800',
    },
    textPositive: {
      color: tokens.accent,
    },
    textNegative: {
      color: tokens.destructive,
    },
    contentContainer: {
      flex: 1,
    },
  });

export default CreditSummaryCards;
