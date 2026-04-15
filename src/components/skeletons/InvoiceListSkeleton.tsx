import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

const InvoiceListSkeleton: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <View key={i} style={styles.card}>
          <View style={styles.left}>
            <Skeleton width={110} height={14} borderRadius={6} />
            <Skeleton width={160} height={11} borderRadius={4} />
          </View>
          <View style={styles.right}>
            <Skeleton width={70} height={14} borderRadius={6} />
            <Skeleton width={20} height={20} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: 4,
    },
    card: {
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    left: {
      gap: 6,
    },
    right: {
      alignItems: 'flex-end',
      gap: 6,
    },
  });

export default InvoiceListSkeleton;

