import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { Package, Wallet } from 'lucide-react-native';
import type { AppNavigationParamList } from '../../navigation/types';

interface BusinessInsightsCardsProps {
  inventoryValue: number;
  totalExpenses: number;
  isLoading: boolean;
}

const BusinessInsightsCards: React.FC<BusinessInsightsCardsProps> = ({
  inventoryValue,
  totalExpenses,
  isLoading,
}) => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();

  return (
    <View style={styles.insightsRow}>
      <Pressable
        style={({ pressed }) => [styles.insightCard, pressed && { opacity: 0.7 }]}
        onPress={() => navigation.navigate('ProductsTab' as any, { screen: 'ProductsList' } as any)}
      >
        <View style={styles.insightHeader}>
          <Package size={18} color={tokens.mutedForeground} />
          <Text style={styles.insightLabel}>Inventory Value</Text>
        </View>
        <Text style={styles.insightValue}>
          {isLoading ? '…' : `₹${Math.round(inventoryValue).toLocaleString('en-IN')}`}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.insightCard, pressed && { opacity: 0.7 }]}
        onPress={() => navigation.navigate('Expenses' as any, { screen: 'ExpensesMain' } as any)}
      >
        <View style={styles.insightHeader}>
          <Wallet size={18} color={tokens.mutedForeground} />
          <Text style={styles.insightLabel}>Total Expenses</Text>
        </View>
        <Text style={styles.insightValue}>
          {isLoading ? '…' : `₹${Math.round(totalExpenses).toLocaleString('en-IN')}`}
        </Text>
      </Pressable>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    insightsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    insightCard: {
      flex: 1,
      backgroundColor: tokens.card,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    insightLabel: {
      fontSize: 12,
      color: tokens.mutedForeground,
      fontWeight: '600',
    },
    insightValue: {
      fontSize: 20,
      fontWeight: '700',
      color: tokens.foreground,
    },
  });

export default BusinessInsightsCards;
