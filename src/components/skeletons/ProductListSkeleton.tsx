import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

const ProductListSkeleton: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map(key => (
        <View key={key} style={styles.row}>
          <Skeleton width={50} height={50} borderRadius={8} />
          <View style={styles.content}>
            <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      gap: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.surface_container_lowest,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 12,
    },
    content: {
      flex: 1,
      gap: 8,
    },
  });

export default ProductListSkeleton;
