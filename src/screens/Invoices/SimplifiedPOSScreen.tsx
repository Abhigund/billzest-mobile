/**
 * SimplifiedPOSScreen — Quick Bill POS
 *
 * Implements the "Quick Bill POS (Full Selected Border)" Stitch design.
 * Best suited for stores with a small product catalog that fits in a grid.
 *
 * Navigates to InvoiceSummary after billing via the same CreateOrder logic.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { useProducts } from '../../logic/productLogic';
import { useInvoiceStore } from '../../stores/invoiceStore';
import {
  useCreateOrder,
} from '../../logic/orderLogic';
import { useOrganization } from '../../contexts/OrganizationContext';
import { generateInvoiceNumber } from '../../utils/invoiceNumberGenerator';
import {
  ArrowLeft,
  Search,
  ScanLine,
  Mic,
  Minus,
  Plus,
  ArrowRight,
  ShoppingCart,
  PackageX,
} from 'lucide-react-native';
import SelectPartyBottomSheet from '../../components/modals/SelectPartyBottomSheet';
import { Party } from '../../types/domain';
import type { AppNavigationParamList } from '../../navigation/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

// ─── Product Card ────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: any;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  tokens: ThemeTokens;
  styles: ReturnType<typeof createStyles>;
}

const ProductCard = React.memo(
  ({ product, qty, onIncrement, onDecrement, tokens, styles }: ProductCardProps) => {
    const isSelected = qty > 0;
    const isOutOfStock = (product.stock_quantity ?? 0) <= 0;

    const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

    return (
      <View
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          isOutOfStock && styles.cardDimmed,
        ]}
      >
        {/* Product image / avatar */}
        <View style={styles.cardImageBox}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.cardImagePlaceholder,
                isOutOfStock && { opacity: 0.35 },
              ]}
            >
              <Text style={[styles.cardInitial, isOutOfStock && { color: tokens.mutedForeground }]}>
                {product.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockLabel}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* Name + price */}
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardName, isOutOfStock && { color: tokens.mutedForeground }]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          <Text style={[styles.cardPrice, isOutOfStock && { color: tokens.mutedForeground }]}>
            {formatCurrency(product.selling_price)}
          </Text>
        </View>

        {/* Stepper */}
        <View style={[styles.stepper, isSelected && styles.stepperSelected]}>
          <Pressable
            style={styles.stepperBtn}
            onPress={onDecrement}
            disabled={isOutOfStock}
            accessibilityLabel={`Decrease quantity for ${product.name}`}
            hitSlop={hitSlop}
          >
            <Minus
              size={16}
              color={isSelected && !isOutOfStock ? tokens.primary : 'rgba(115,115,115,0.38)'}
              strokeWidth={2.5}
            />
          </Pressable>
          <Text
            style={[
              styles.stepperQty,
              { color: isSelected ? tokens.foreground : 'rgba(115,115,115,0.38)' },
            ]}
          >
            {qty}
          </Text>
          <Pressable
            style={styles.stepperBtn}
            onPress={onIncrement}
            disabled={isOutOfStock}
            accessibilityLabel={`Increase quantity for ${product.name}`}
            hitSlop={hitSlop}
          >
            <Plus
              size={16}
              color={isOutOfStock ? 'rgba(115,115,115,0.38)' : tokens.primary}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>
      </View>
    );
  },
);
ProductCard.displayName = 'ProductCard';

// ─── Main Screen ─────────────────────────────────────────────────────────────

const SimplifiedPOSScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();

  const { data: products = [] } = useProducts();
  const { lineItems, addItem, updateQuantity, removeLineItem, setClient, setMode, resetInvoice } =
    useInvoiceStore();
  const createInvoice = useCreateOrder();
  const { organizationId } = useOrganization();

  const [query, setQuery] = useState('');
  const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
  const [isPartySheetVisible, setPartySheetVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Party | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        (p.barcode ?? '').toLowerCase().includes(q),
    );
  }, [products, query]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const getQty = useCallback(
    (productId: string) =>
      lineItems.find((l) => l.product.id === productId)?.quantity ?? 0,
    [lineItems],
  );

  const totalItems = lineItems.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = lineItems.reduce((s, i) => s + i.rate * i.quantity, 0);

  const increment = useCallback(
    (product: any) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const existing = lineItems.find((l) => l.product.id === product.id);
      if (existing) {
        updateQuantity(existing.id, existing.quantity + 1);
      } else {
        addItem(product);
      }
    },
    [lineItems, addItem, updateQuantity],
  );

  const decrement = useCallback(
    (product: any) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const existing = lineItems.find((l) => l.product.id === product.id);
      if (!existing) return;
      if (existing.quantity === 1) {
        removeLineItem(existing.id);
      } else {
        updateQuantity(existing.id, existing.quantity - 1);
      }
    },
    [lineItems, removeLineItem, updateQuantity],
  );

  // ── Proceed / bill ─────────────────────────────────────────────────────────
  const handleProceed = () => {
    if (lineItems.length === 0) {
      Alert.alert('Cart Empty', 'Add at least one item to proceed.');
      return;
    }
    // Prompt party selection first
    setPartySheetVisible(true);
  };

  const handlePartySelected = useCallback(
    async (party: Party) => {
      setSelectedClient(party);
      setPartySheetVisible(false);
      setIsSaving(true);

      try {
        setMode('sale');
        setClient(party);

        const subtotal = lineItems.reduce((s, i) => s + i.rate * i.quantity, 0);
        const taxAmount = lineItems.reduce((s, i) => s + i.taxAmount, 0);
        const finalTotal = subtotal + taxAmount;
        const cgst = taxAmount / 2;
        const sgst = taxAmount / 2;
        const invoiceNumber = await generateInvoiceNumber();

        const created = await createInvoice.mutateAsync({
          order: {
            party_id: party.id,
            invoice_number: invoiceNumber,
            payment_status: 'PENDING',
            subtotal,
            tax_amount: taxAmount,
            total_amount: finalTotal,
            notes: null,
          },
          items: lineItems.map((i) => ({
            product_id: i.product.id,
            product_name: i.product.name,
            quantity: i.quantity,
            unit_price: i.rate,
            total_price: i.total,
            tax_amount: i.taxAmount,
            tax_rate: i.taxRate,
          })),
        });

        resetInvoice();
        setMode(null);
        setSelectedClient(null);

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        navigation.navigate('InvoicesTab', {
          screen: 'InvoiceSummary',
          params: {
            invoiceId: created.id,
            invoiceNumber,
            subtotal,
            discount: 0,
            cgst,
            sgst,
            totalAmount: finalTotal,
            amountReceived: 0,
            dueDate: dueDate.toISOString(),
          },
        });
      } catch (err: any) {
        Alert.alert('Failed to save', err?.message ?? 'Unable to create invoice.');
      } finally {
        setIsSaving(false);
      }
    },
    [lineItems, createInvoice, navigation, resetInvoice, setClient, setMode],
  );

  const handleBack = () => {
    if (lineItems.length > 0) {
      Alert.alert('Discard Cart?', 'Your current cart will be cleared.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            resetInvoice();
            navigation.goBack();
          },
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top App Bar ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityLabel="Back to invoices"
          hitSlop={hitSlop}
        >
          <ArrowLeft size={24} color={tokens.primary} strokeWidth={2.5} />
        </Pressable>

        {/* Search bar */}
        <View style={styles.searchBox}>
          <Search size={16} color={tokens.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by item name..."
            placeholderTextColor='rgba(115,115,115,0.5)'
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          <Pressable
            onPress={() => {}}
            accessibilityLabel="Scan product barcode"
            hitSlop={hitSlop}
          >
            <ScanLine size={20} color={tokens.primary} />
          </Pressable>
        </View>

        <Pressable
          style={styles.micBtn}
          accessibilityLabel="Voice search"
          hitSlop={hitSlop}
        >
          <Mic size={20} color={tokens.foreground} />
        </Pressable>
      </View>

      {/* ── Product Count Strip ───────────────────────────────────────────── */}
      <View style={styles.countStrip}>
        <Text style={styles.countText}>
          Showing {filtered.length} of {products.length} products
        </Text>
      </View>

      {/* ── Product Grid ─────────────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <PackageX size={48} color='rgba(115,115,115,0.25)' />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubText}>Try a different search</Text>
          </View>
        }
        renderItem={({ item: product }) => (
          <ProductCard
            product={product}
            qty={getQty(product.id)}
            onIncrement={() => increment(product)}
            onDecrement={() => decrement(product)}
            tokens={tokens}
            styles={styles}
          />
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* ── Sticky Cart Bar ───────────────────────────────────────────────── */}
      {totalItems > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartCountLabel}>{totalItems} item{totalItems !== 1 ? 's' : ''} selected</Text>
            <Text style={styles.cartTotal}>{formatCurrency(totalAmount)}</Text>
          </View>
          <Pressable
            style={[styles.proceedBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleProceed}
            disabled={isSaving}
          >
            <Text style={styles.proceedText}>{isSaving ? 'Saving…' : 'Proceed'}</Text>
            <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      )}

      {/* ── Party Selection Sheet ─────────────────────────────────────────── */}
      <SelectPartyBottomSheet
        visible={isPartySheetVisible}
        onClose={() => setPartySheetVisible(false)}
        onSelectParty={handlePartySelected}
        mode="sale"
      />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: tokens.background },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 10,
      backgroundColor: tokens.background,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    backBtn: { padding: 8, borderRadius: 8 },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.06)',
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: tokens.foreground,
      padding: 0,
    },
    micBtn: { padding: 8, borderRadius: 8 },

    // Count strip
    countStrip: { paddingHorizontal: 20, paddingVertical: 10 },
    countText: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.mutedForeground,
    },

    // Grid
    row: { gap: 12, paddingHorizontal: 16 },
    gridContent: { gap: 12, paddingTop: 4, paddingBottom: 16 },

    // Card
    card: {
      flex: 1,
      backgroundColor: tokens.card,
      borderRadius: 16,
      padding: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
      shadowColor: '#1a1a2e',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardSelected: {
      borderColor: tokens.primary,
      borderWidth: 2,
      backgroundColor: tokens.primaryAlpha10,
    },
    cardDimmed: { opacity: 0.6 },
    cardImageBox: {
      aspectRatio: 1,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: tokens.muted,
      position: 'relative',
    },
    cardImage: { width: '100%', height: '100%' },
    cardImagePlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.primaryAlpha15,
    },
    cardInitial: {
      fontSize: 28,
      fontWeight: '800',
      color: tokens.primary,
    },
    outOfStockOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.65)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    outOfStockLabel: {
      backgroundColor: '#1e1e1e',
      color: '#ffffff',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1.5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    cardInfo: { gap: 2 },
    cardName: {
      fontSize: 14,
      fontWeight: '700',
      color: tokens.foreground,
      lineHeight: 18,
    },
    cardPrice: {
      fontSize: 13,
      fontWeight: '700',
      color: tokens.primary,
    },

    // Stepper
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tokens.muted,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    stepperSelected: {
      backgroundColor: '#ffffff60',
    },
    stepperBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperQty: {
      fontSize: 14,
      fontWeight: '800',
      minWidth: 20,
      textAlign: 'center',
    },

    // Empty state
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
      gap: 8,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.mutedForeground,
    },
    emptySubText: { fontSize: 13, color: 'rgba(115,115,115,0.5)' },

    // Cart bar
    cartBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tokens.card,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.08)',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: Platform.OS === 'ios' ? 28 : 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 8,
    },
    cartCountLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    cartTotal: {
      fontSize: 22,
      fontWeight: '900',
      color: tokens.foreground,
      letterSpacing: -0.5,
      marginTop: 2,
    },
    proceedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: tokens.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 14,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    proceedText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ffffff',
    },
  });

export default SimplifiedPOSScreen;
