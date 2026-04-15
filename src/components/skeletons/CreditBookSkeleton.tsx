import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

const CreditBookSkeleton: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Skeleton width={60} height={14} borderRadius={6} />
          <Skeleton width={100} height={24} borderRadius={8} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.summaryCard}>
          <Skeleton width={60} height={14} borderRadius={6} />
          <Skeleton width={100} height={24} borderRadius={8} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.summaryCard}>
          <Skeleton width={60} height={14} borderRadius={6} />
          <Skeleton width={100} height={24} borderRadius={8} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Tab Chips */}
      <View style={styles.tabs}>
        <Skeleton width={100} height={36} borderRadius={18} />
        <Skeleton width={100} height={36} borderRadius={18} />
        <Skeleton width={100} height={36} borderRadius={18} />
      </View>

      {/* List Items */}
      <View style={styles.list}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.card}>
            <View style={styles.avatar}>
              <Skeleton width={40} height={40} borderRadius={20} />
            </View>
            <View style={styles.info}>
              <Skeleton width={140} height={16} borderRadius={8} />
              <Skeleton width={100} height={14} borderRadius={6} style={{ marginTop: 6 }} />
            </View>
            <View style={styles.balance}>
              <Skeleton width={70} height={16} borderRadius={8} />
              <Skeleton width={50} height={12} borderRadius={6} style={{ marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      paddingTop: 8,
      gap: 20,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 8,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: tokens.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    tabs: {
      flexDirection: 'row',
      gap: 8,
    },
    list: {
      gap: 12,
    },
    card: {
      backgroundColor: tokens.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      marginRight: 4,
    },
    info: {
      flex: 1,
    },
    balance: {
      alignItems: 'flex-end',
    },
  });

export default CreditBookSkeleton;

