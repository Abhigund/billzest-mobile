import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

const ExpenseListSkeleton: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={styles.card}>
          <View style={styles.header}>
            <Skeleton width={180} height={16} borderRadius={8} />
            <Skeleton width={80} height={16} borderRadius={8} />
          </View>
          <View style={styles.meta}>
            <Skeleton width={100} height={14} borderRadius={6} />
            <Skeleton width={80} height={14} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: 10,
    },
    card: {
      backgroundColor: tokens.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    meta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
  });

export default ExpenseListSkeleton;

