import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Product } from '../types/domain';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';

export type ProductStatus =
  | 'in-stock'
  | 'low-stock'
  | 'out-of-stock'
  | 'near-expiry';

export const getProductStatus = (product: Product): ProductStatus => {
  if (product.stock_quantity <= 0) return 'out-of-stock';
  const threshold = (product as any).low_stock_threshold ?? 10;
  if (product.stock_quantity < threshold) return 'low-stock';

  if (product.expiry_date) {
    const expiry = new Date(product.expiry_date);
    const now = new Date();
    const daysToExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysToExpiry > 0 && daysToExpiry <= 30) return 'near-expiry';
  }

  return 'in-stock';
};

const getStatusVisual = (status: ProductStatus, tokens: ThemeTokens) => {
  switch (status) {
    case 'low-stock':
      return { label: 'Low Stock', bgColor: tokens.warningAlpha15, color: tokens.warning, stockWeight: '700' as const };
    case 'out-of-stock':
      return { label: 'Out of Stock', bgColor: tokens.destructiveAlpha15, color: tokens.destructive, stockWeight: '700' as const };
    case 'near-expiry':
      return { label: 'Near Expiry', bgColor: tokens.warningAlpha15, color: tokens.warning, stockWeight: '700' as const };
    default:
      return { label: 'In Stock', bgColor: tokens.primaryAlpha15, color: tokens.primary, stockWeight: '400' as const };
  }
};

const formatCurrency = (value: number) =>
  `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onShare,
  onPrint,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const status = getProductStatus(product);
  const statusVisual = getStatusVisual(status, tokens);
  const categoryName = (product as any).categories?.name || (product as any).category || null;
  const skuMeta = [product.sku, categoryName].filter(Boolean).join(' · ');

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${product.name}`}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
          {product.name}
        </Text>
        <View style={styles.stockBlock}>
          <Text style={[styles.stockCount, { color: statusVisual.color, fontWeight: statusVisual.stockWeight }]}>
            {`Stock: ${product.stock_quantity}`}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusVisual.bgColor }]}>
            <Text style={[styles.statusBadgeText, { color: statusVisual.color }]}>
              {statusVisual.label.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.price}>{formatCurrency(product.selling_price)}</Text>
        {skuMeta ? (
          <Text style={styles.skuMeta} numberOfLines={1}>{skuMeta}</Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    row: {
      backgroundColor: tokens.surface_container_lowest,
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: tokens.spacingMd, // 12px
      gap: tokens.spacingXs, // 4px
    },
    rowPressed: {
      backgroundColor: tokens.muted,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: tokens.spacingSm, // 8px
    },
    productName: {
      flex: 1,
      fontSize: 15, // Primary size
      fontWeight: '600', // Semi-bold
      color: tokens.foreground,
      letterSpacing: -0.2,
    },
    stockBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6, // Minimal spacing for compact elements
      flexShrink: 0,
    },
    stockCount: {
      fontSize: 12, // Secondary size
    },
    statusBadge: {
      paddingHorizontal: 6, // Minimal for badge
      paddingVertical: 2, // Minimal for badge
      borderRadius: tokens.radiusXs, // 4px
    },
    statusBadgeText: {
      fontSize: 9, // Small secondary text
      fontWeight: '600', // Semi-bold for status
      letterSpacing: 0.4,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    price: {
      fontSize: 14, // Emphasis size
      fontWeight: '700', // Bold for emphasis
      color: tokens.primary,
    },
    skuMeta: {
      fontSize: 12, // Bumped for hierarchy contrast vs name (15px/600)
      color: tokens.mutedForeground,
      fontWeight: '500',
      flexShrink: 1,
      textAlign: 'right',
      opacity: 0.75, // Subtle de-emphasis without losing readability
    },
  });

export default React.memo(ProductCard);
