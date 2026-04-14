import React, { useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  FlatList,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductsStackParamList } from '../../navigation/types';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { logger } from '../../utils/logger';
import { useProducts, useProductMutations } from '../../logic/productLogic';
import { Product } from '../../types/domain';
import QuickLinksCard from '../../components/QuickLinksCard';
import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../components/ScreenWrapper';
import FAB from '../../components/ui/FAB';
import ProductCard, { getProductStatus } from '../../components/ProductCard';
import ProductFilterSheet from '../../components/modals/ProductFilterSheet';
import ProductOptionsSheet from '../../components/modals/ProductOptionsSheet';
import BarcodeScanner from '../../components/Scanner/BarcodeScanner';
import SearchBar from '../../components/SearchBar';
import {
  MoreHorizontal,
  Plus,
  Package,
  AlertTriangle,
  Scan,
  MoreVertical,
  Store,
  Settings,
  Grid,
  Printer,
} from 'lucide-react-native';

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

const ProductsListScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NativeStackNavigationProp<ProductsStackParamList>>();
  const { organizationId } = useOrganization();

  const [activeFilters, setActiveFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterSheetVisible, setFilterSheetVisible] = useState(false);
  const [isOptionsSheetVisible, setOptionsSheetVisible] = useState(false);
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const {
    data: products = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useProducts();

  const { deleteProduct, updateProduct } = useProductMutations();

  const errorMessage = React.useMemo(() => {
    if (!error) return null;
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Something went wrong while loading products.';
  }, [error]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleOpenFilters = useCallback(() => {
    setFilterSheetVisible(true);
  }, []);

  const handleScanBarcode = useCallback(() => {
    setScannerVisible(true);
  }, []);

  const handleBarcodeScanned = useCallback(
    async (code: string) => {
      const scanStartTime = Date.now();
      const { logger } = await import('../../utils/logger');

      try {
        // First try to find in local products list
        const localSearchStartTime = Date.now();
        let product = products.find(p => p.barcode === code || p.sku === code);
        const localSearchTime = Date.now() - localSearchStartTime;

        logger.log('[Barcode Scan] Local search completed', {
          barcode: code,
          found: !!product,
          timeMs: localSearchTime.toFixed(2),
        });

        // If not found locally, try service lookup
        if (!product) {
          const serviceSearchStartTime = Date.now();
          const { productsService } = await import(
            '../../supabase/productsService'
          );
          const foundProduct = await productsService.findProductByBarcode(
            organizationId || '',
            code,
          );
          const serviceSearchTime = Date.now() - serviceSearchStartTime;

          logger.log('[Barcode Scan] Service lookup completed', {
            barcode: code,
            found: !!foundProduct,
            timeMs: serviceSearchTime.toFixed(2),
          });

          if (serviceSearchTime > 1000) {
            logger.warn('[Barcode Scan] Service lookup exceeded 1 second', {
              barcode: code,
              timeMs: serviceSearchTime.toFixed(2),
            });
          }

          if (foundProduct) {
            product = foundProduct;
          }
        }

        const totalScanTime = Date.now() - scanStartTime;
        logger.log('[Barcode Scan] Total scan operation completed', {
          barcode: code,
          found: !!product,
          totalTimeMs: totalScanTime.toFixed(2),
          localTimeMs: localSearchTime.toFixed(2),
        });

        setScannerVisible(false);

        if (product) {
          // Set search term to product name and navigate to detail
          setSearchTerm(product.name);
          navigation.navigate('ProductDetail', { product });
        } else {
          Alert.alert('Not Found', `No product found with barcode: ${code}`);
        }
      } catch (error: unknown) {
        const totalScanTime = Date.now() - scanStartTime;
        logger.error('[Barcode Scan] Scan operation failed', error, {
          barcode: code,
          totalTimeMs: totalScanTime.toFixed(2),
        });
        setScannerVisible(false);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        Alert.alert('Error', `Failed to lookup product: ${errorMessage}`);
      }
    },
    [products, navigation],
  );

  const handleMoreOptions = useCallback(() => {
    setOptionsSheetVisible(true);
  }, []);

  const handleShareProduct = useCallback(async (product: Product) => {
    try {
      await Share.share({
        message: `Product: ${product.name}\nPrice: ₹${product.selling_price}\nStock: ${product.stock_quantity}`,
      });
    } catch (error) {
      logger.error('[Products] Share failed', error);
    }
  }, []);

  const handlePrintProduct = useCallback((product: Product) => {
    Alert.alert('Print', `Printing label for ${product.name}...`);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filter inactive products based on showInactive setting
      if (!showInactive && !product.is_active) {
        return false;
      }

      const status = getProductStatus(product);

      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesFilter = (() => {
        // Status Filter
        const statusFilter = activeFilters.status || 'All';
        if (statusFilter !== 'All') {
          if (statusFilter === 'Low Stock' && status !== 'low-stock')
            return false;
          if (statusFilter === 'Out of Stock' && status !== 'out-of-stock')
            return false;
          if (statusFilter === 'Near Expiry' && status !== 'near-expiry')
            return false;
          if (statusFilter === 'Expired') {
            const isExpired = product.expiry_date
              ? new Date(product.expiry_date) < new Date()
              : false;
            if (!isExpired) return false;
          }
        }

        // Category Filter
        if (activeFilters.categories && activeFilters.categories.length > 0) {
          const productCategory = product.category || 'General';
          if (!activeFilters.categories.includes(productCategory)) {
            return false;
          }
        }

        return true;
      })();

      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, activeFilters, products, showInactive]);

  return (
    <ScreenWrapper>
      <View style={styles.screen}>
        <FlatList
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={tokens.primary}
            />
          }
          data={!isLoading && !error ? filteredProducts : []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <QuickLinksCard
                items={[
                  {
                    id: 'online-store',
                    icon: <Store color={tokens.primary} size={24} />,
                    label: 'Online Store',
                    onPress: () => {
                      // Navigate to Settings via drawer root navigation
                      // TODO: Use drawer navigation or restructure app navigation to support cross-stack navigation
                      Alert.alert('Info', 'Online Store settings will be available soon.');
                    },
                  },
                  {
                    id: 'stock',
                    icon: <Package color={tokens.primary} size={24} />,
                    label: 'Stock Summary',
                    onPress: () => navigation.navigate('StockSummary'),
                  },
                  {
                    id: 'barcodes',
                    icon: <Printer color={tokens.primary} size={24} />,
                    label: 'Barcodes',
                    onPress: () => navigation.navigate('BarcodeGenerator', {}),
                  },
                  {
                    id: 'all',
                    icon: <Grid color={tokens.primary} size={24} />,
                    label: 'Show All',
                    onPress: () => Alert.alert('Info', 'Showing all items.'),
                  },
                ]}
              />

              <SearchBar
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search product"
                showFilter={true}
                onFilterPress={handleOpenFilters}
                filterActive={Object.keys(activeFilters).length > 0}
                trailingActions={
                  <>
                    <Pressable
                      style={styles.trailingIconButton}
                      onPress={handleScanBarcode}
                      accessibilityLabel="Scan barcode"
                    >
                      <Scan color={tokens.primary} size={18} />
                    </Pressable>
                    <Pressable
                      style={styles.trailingIconButton}
                      onPress={handleMoreOptions}
                      accessibilityLabel="More product options"
                    >
                      <MoreVertical color={tokens.primary} size={18} />
                    </Pressable>
                  </>
                }
              />

              {isLoading && !isRefetching && (
                <ActivityIndicator
                  size="large"
                  color={tokens.primary}
                  style={{ marginTop: 20, marginBottom: 20 }}
                />
              )}
            </>
          }
          ListEmptyComponent={
            <>
              {!isLoading && !!error && (
                <EmptyState
                  icon={<AlertTriangle color={tokens.destructive} size={32} />}
                  title="Unable to load products"
                  description={errorMessage ?? 'Check your connection and retry.'}
                  actionLabel="Try Again"
                  onAction={onRefresh}
                />
              )}

              {!isLoading && !error && filteredProducts.length === 0 && (
                <EmptyState
                  icon={<Package color={tokens.primary} size={32} />}
                  title="No products found"
                  description="Try adjusting your search or filters, or add a new item to getting started."
                  actionLabel="Add New Item"
                  onAction={() =>
                    navigation.navigate('ProductForm', { mode: 'create' })
                  }
                />
              )}
            </>
          }
          renderItem={({ item: product }) => {
            const status = getProductStatus(product);
            const isExpired =
              product.expiry_date &&
              new Date(product.expiry_date) < new Date();
            const isNearExpiry = status === 'near-expiry';

            return (
              <View
                style={[
                  styles.productCardWrapper,
                  (isExpired || isNearExpiry) && styles.productCardWarning,
                ]}
              >
                {(isExpired || isNearExpiry) && (
                  <View
                    style={[
                      styles.expiryWarningBadge,
                      isExpired && styles.expiryWarningBadgeExpired,
                    ]}
                  >
                    <AlertTriangle
                      size={16}
                      color={
                        isExpired
                          ? tokens.destructiveForeground
                          : tokens.warningForeground
                      }
                    />
                  </View>
                )}
                <ProductCard
                  product={product}
                  onPress={() => {
                    navigation.navigate('ProductDetail', { product });
                  }}
                  onShare={() => handleShareProduct(product)}
                  onPrint={() => handlePrintProduct(product)}
                />
              </View>
            );
          }}
          ListFooterComponent={<View style={styles.listSpacer} />}
        />

        <FAB
          label="Add New Item"
          icon={<Plus color="#fff" size={24} />}
          onPress={() => navigation.navigate('ProductForm', { mode: 'create' })}
          accessibilityLabel="Add new item"
        />
      </View>

      <ProductFilterSheet
        visible={isFilterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        onApply={filters => setActiveFilters(filters)}
      />

      <ProductOptionsSheet
        visible={isOptionsSheetVisible}
        onClose={() => setOptionsSheetVisible(false)}
        showInactive={showInactive}
        onToggleShowInactive={setShowInactive}
      />

      <Modal
        visible={isScannerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <BarcodeScanner
          onCodeScanned={handleBarcodeScanned}
          onClose={() => setScannerVisible(false)}
        />
      </Modal>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    container: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    content: {
      padding: 20,
      paddingBottom: 120,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    secondaryButtonText: {
      color: tokens.foreground,
      fontWeight: '600',
    },
    quickLinkLabel: {
      color: tokens.foreground,
      fontWeight: '600',
    },

    trailingIconButton: {
      width: 44,
      height: 44,
      marginLeft: 10,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.card,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    roundedIconButton: {
      width: 60,
      height: 52,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.card,
      marginLeft: 6,
    },
    roundedIconLabel: {
      color: tokens.foreground,
      fontWeight: '600',
      fontSize: 12,
    },
    filterScroll: {
      marginBottom: 18,
    },
    filtersContent: {
      paddingRight: 20,
    },
    filterChip: {
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: tokens.border,
      marginRight: 10,
    },
    filterChipActive: {
      backgroundColor: tokens.primary,
      borderColor: tokens.primary,
    },
    filterChipText: {
      color: tokens.foreground,
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: tokens.primaryForeground,
    },
    productList: {
      marginBottom: 4,
    },
    productCard: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 16,
    },
    cardPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.99 }],
    },
    productCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    productTitleBlock: {
      flex: 1,
      paddingRight: 12,
    },
    productName: {
      fontSize: 16,
      color: tokens.foreground,
      fontWeight: '700',
    },
    productMeta: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 4,
    },
    productDetailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    detailBlock: {
      flex: 1,
      paddingRight: 10,
    },
    detailLabel: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
    },
    productFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    footerLabel: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginBottom: 4,
    },
    footerValue: {
      fontSize: 13,
      color: tokens.foreground,
      fontWeight: '600',
    },
    footerActions: {
      flexDirection: 'row',
      marginLeft: -8,
    },
    cardIconButton: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: tokens.border,
      marginLeft: 8,
    },
    cardIconButtonText: {
      color: tokens.foreground,
      fontWeight: '600',
      fontSize: 12,
    },
    listSpacer: {
      height: 20,
    },
    productCardWrapper: {
      position: 'relative',
      marginBottom: 16,
    },
    productCardWarning: {
      borderLeftWidth: 4,
      borderLeftColor: tokens.warning,
    },
    expiryWarningBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(250,204,21,0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    expiryWarningBadgeExpired: {
      backgroundColor: 'rgba(220,76,70,0.9)',
    },
  });

export default ProductsListScreen;
