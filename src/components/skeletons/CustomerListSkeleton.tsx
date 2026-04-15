import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

const CustomerListSkeleton: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={styles.card}>
          <View style={styles.avatar}>
            <Skeleton width={48} height={48} borderRadius={24} />
          </View>
          <View style={styles.info}>
            <Skeleton width={150} height={16} borderRadius={8} />
            <Skeleton width={100} height={14} borderRadius={6} style={{ marginTop: 6 }} />
          </View>
          <View style={styles.balance}>
            <Skeleton width={80} height={16} borderRadius={8} />
            <Skeleton width={60} height={12} borderRadius={6} style={{ marginTop: 4 }} />
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
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 14,
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

export default CustomerListSkeleton;

