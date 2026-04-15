import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

const PurchaseListSkeleton: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={styles.card}>
          <View style={styles.header}>
            <Skeleton width={140} height={16} borderRadius={8} />
            <Skeleton width={70} height={16} borderRadius={8} />
          </View>
          <View style={styles.meta}>
            <Skeleton width={120} height={14} borderRadius={6} />
            <Skeleton width={90} height={14} borderRadius={6} />
          </View>
          <View style={styles.footer}>
            <Skeleton width={100} height={18} borderRadius={8} />
            <Skeleton width={60} height={14} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    card: {
      backgroundColor: tokens.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 12,
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
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
  });

export default PurchaseListSkeleton;

