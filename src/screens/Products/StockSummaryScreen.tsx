import React, { useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenWrapper from '../../components/ScreenWrapper';
import DetailHeader from '../../components/DetailHeader';
import { ProductsStackParamList } from '../../navigation/types';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { useProducts } from '../../logic/productLogic';
import { FileText, FileSpreadsheet, Filter } from 'lucide-react-native';
import StockFilterSheet from '../../components/modals/StockFilterSheet';
import EmptyState from '../../components/EmptyState';
import { getProductStatus } from '../../components/ProductCard';

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const StockSummaryScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NativeStackNavigationProp<ProductsStackParamList>>();
  const { data: products = [], isLoading, error, refetch, isRefetching } = useProducts();

  // State for "Show as of date"
  const [showAsOfDate, setShowAsOfDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // State for filters
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const metrics = useMemo(() => {
    const totalItems = products.length;
    const lowStockItems = products.filter(p => getProductStatus(p) === 'low-stock').length;
    // Inventory cost = purchase cost (mrp) × stock, fallback to sale price if mrp not available
    const inventoryCost = products.reduce((sum, p) => {
      const cost = p.mrp || p.selling_price || 0;
      return sum + cost * (p.stock_quantity || 0);
    }, 0);
    // Stock value = sale price × stock (for comparison)
    const stockValue = products.reduce((sum, p) => sum + (p.selling_price || 0) * (p.stock_quantity || 0), 0);
    return { totalItems, lowStockItems, inventoryCost, stockValue };
  }, [products]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [products]);

  // Handler for "Show as of date" toggle
  const handleToggleAsOfDate = useCallback((value: boolean) => {
    setShowAsOfDate(value);
    if (value) {
      Alert.alert(
        'Select Date',
        'Enter date to view stock as-of that date (YYYY-MM-DD):',
        [
          {
            text: 'Cancel',
            onPress: () => setShowAsOfDate(false),
            style: 'cancel',
          },
          {
            text: 'Use Today',
            onPress: () => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
            },
          },
          {
            text: 'Custom',
            onPress: () => {
              Alert.prompt(
                'Enter Date',
                'Format: YYYY-MM-DD',
                [
                  { text: 'Cancel', onPress: () => setShowAsOfDate(false), style: 'cancel' },
                  {
                    text: 'OK',
                    onPress: (date: string | undefined) => {
                      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                        setSelectedDate(date);
                      } else {
                        Alert.alert('Invalid', 'Please enter date in YYYY-MM-DD format');
                        setShowAsOfDate(false);
                      }
                    },
                  },
                ],
                'plain-text',
                selectedDate,
              );
            },
          },
        ],
      );
    }
  }, [selectedDate]);

  // Handler for Filter button
  const handleOpenFilters = useCallback(() => {
    setShowFilters(true);
  }, []);

  // Handler to clear filters
  const handleClearFilters = useCallback(() => {
    setFilterCategory(null);
    setFilterStatus(null);
  }, []);

  return (
    <ScreenWrapper>
      <DetailHeader
        title="Stock Summary"
        actions={[
          {
            icon: <FileText size={18} color={tokens.foreground} />,
            onPress: () => {
              Alert.alert(
                'Export PDF',
                'PDF export feature will be available in a future update. For now, you can share individual product details.',
              );
            },
            accessibilityLabel: 'Export PDF',
          },
          {
            icon: <FileSpreadsheet size={18} color={tokens.foreground} />,
            onPress: () => {
              Alert.alert(
                'Export Excel',
                'Excel export feature will be available in a future update. For now, you can share individual product details.',
              );
            },
            accessibilityLabel: 'Export XLS',
          },
        ]}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.rowBetween}>
          <View style={styles.inlineRow}>
            <Switch 
              value={showAsOfDate} 
              onValueChange={handleToggleAsOfDate}
              thumbColor={tokens.primaryForeground}
              trackColor={{ false: tokens.muted, true: tokens.primary }} 
            />
            <Text style={styles.mutedText}>
              {showAsOfDate ? `Stock as on: ${selectedDate}` : 'Show stock as on Date'}
            </Text>
          </View>
          <Pressable style={styles.filterPill} onPress={handleOpenFilters}>
            <Filter color={tokens.foreground} size={16} />
            <Text style={styles.filterPillText}>Filters</Text>
          </Pressable>
        </View>

        <View style={styles.filtersRow}>
          {['Item Category - All', 'Stock - All', 'Status - All'].map(label => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>No. of Items</Text>
            <Text style={styles.kpiValue}>{metrics.totalItems}</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiWarn]}>
            <Text style={styles.kpiLabel}>Low Stock Items</Text>
            <Text style={[styles.kpiValue, styles.kpiWarnText]}>{metrics.lowStockItems}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Inventory Cost</Text>
            <Text style={styles.kpiValue}>{formatCurrency(metrics.inventoryCost)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Stock Value</Text>
            <Text style={styles.kpiValue}>{formatCurrency(metrics.stockValue)}</Text>
          </View>
        </View>

        {isLoading && !isRefetching ? (
          <ActivityIndicator size="large" color={tokens.primary} style={{ marginTop: 24 }} />
        ) : error ? (
          <EmptyState
            icon={<FileText color={tokens.primary} size={28} />}
            title="Unable to load stock summary"
            description="Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        ) : sortedProducts.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet color={tokens.primary} size={28} />}
            title="No products"
            description="Add products to see stock summary."
            actionLabel="Add Item"
            onAction={() => navigation.navigate('ProductForm', { mode: 'create' })}
          />
        ) : (
          sortedProducts.map(product => {
            const stockQty = product.stock_quantity ?? 0;
            const purchaseCost = product.mrp || product.selling_price || 0;
            const inventoryCost = purchaseCost * stockQty;
            const stockValue = (product.selling_price || 0) * stockQty;
            const isLow = getProductStatus(product) === 'low-stock';
            const status = getProductStatus(product);
            const isExpired = product.expiry_date && new Date(product.expiry_date) < new Date();
            const isNearExpiry = status === 'near-expiry';
            
            return (
              <View key={product.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{product.name}</Text>
                  {(isExpired || isNearExpiry) && (
                    <View style={[styles.expiryBadge, isExpired && styles.expiryBadgeExpired]}>
                      <Text style={[styles.expiryBadgeText, isExpired && styles.expiryBadgeTextExpired]}>
                        {isExpired ? 'Expired' : 'Near Expiry'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.itemMetaRow}>
                  <View>
                    <Text style={styles.itemMetaLabel}>Inventory Cost</Text>
                    <Text style={styles.itemMetaValue}>{formatCurrency(inventoryCost)}</Text>
                  </View>
                  <View>
                    <Text style={styles.itemMetaLabel}>Stock Value</Text>
                    <Text style={styles.itemMetaValue}>{formatCurrency(stockValue)}</Text>
                  </View>
                  <View>
                    <Text style={styles.itemMetaLabel}>Stock Qty</Text>
                    <Text style={[styles.itemMetaValue, isLow && styles.itemWarn]}>
                      {stockQty}
                    </Text>
                  </View>
                </View>
                {product.expiry_date && (
                  <View style={styles.expiryRow}>
                    <Text style={styles.expiryLabel}>Expiry:</Text>
                    <Text style={[styles.expiryDate, isExpired && styles.expiryDateExpired]}>
                      {new Date(product.expiry_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <StockFilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentStatus={filterStatus}
        onApply={({ status }) => setFilterStatus(status)}
      />
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 80 },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.card,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    inlineRow: { flexDirection: 'row', alignItems: 'center' },
    mutedText: { color: tokens.mutedForeground, marginLeft: 8 },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: tokens.card,
    },
    filterPillText: { marginLeft: 6, color: tokens.foreground, fontWeight: '600' },
    filtersRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
    chip: {
      borderRadius: 18,
      backgroundColor: tokens.card,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },
    chipText: { color: tokens.foreground, fontWeight: '600' },
    kpiRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      marginBottom: 16,
      flexWrap: 'wrap',
    },
    kpiCard: {
      flex: 1,
      minWidth: '30%',
      backgroundColor: tokens.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 12,
      marginRight: 10,
      marginBottom: 10,
    },
    kpiLabel: { color: tokens.mutedForeground, marginBottom: 6 },
    kpiValue: { color: tokens.foreground, fontWeight: '700', fontSize: 16 },
    kpiWarn: { borderColor: tokens.destructive, backgroundColor: tokens.card },
    kpiWarnText: { color: tokens.destructive },
    itemCard: {
      backgroundColor: tokens.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 14,
      marginBottom: 10,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    itemName: { 
      color: tokens.foreground, 
      fontWeight: '700', 
      flex: 1,
      fontSize: 16,
    },
    expiryBadge: {
      backgroundColor: 'rgba(250,204,21,0.18)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    expiryBadgeExpired: {
      backgroundColor: 'rgba(220,76,70,0.2)',
    },
    expiryBadgeText: {
      color: tokens.warning,
      fontSize: 11,
      fontWeight: '700',
    },
    expiryBadgeTextExpired: {
      color: tokens.destructive,
    },
    itemMetaRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    itemMetaLabel: {
      fontSize: 11,
      color: tokens.mutedForeground,
      marginBottom: 4,
    },
    itemMetaValue: {
      fontSize: 14,
      color: tokens.foreground,
      fontWeight: '700',
    },
    itemMeta: { color: tokens.mutedForeground },
    itemWarn: { color: tokens.destructive, fontWeight: '700' },
    expiryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
    },
    expiryLabel: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginRight: 6,
    },
    expiryDate: {
      fontSize: 13,
      color: tokens.foreground,
      fontWeight: '600',
    },
    expiryDateExpired: {
      color: tokens.destructive,
      fontWeight: '700',
    },

  });

export default StockSummaryScreen;
