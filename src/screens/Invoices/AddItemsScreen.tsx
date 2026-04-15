/**
 * AddItemsScreen — full-screen product picker
 * Matches the `add_products_uniform_steppers` Stitch design.
 *
 * Accepts (via route.params):
 *   currentLineItems  – current cart line items so quantities sync correctly
 *
 * Returns (via navigation.navigate('AddSale') on "Add to Invoice"):
 *   Mutation applied directly to useInvoiceStore (addItem / updateQuantity / removeLineItem)
 */
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import { useProducts } from "../../logic/productLogic";
import { useInvoiceStore } from "../../stores/invoiceStore";
import { formatCurrency, getInitials } from "../../utils/formatting";
import {
  ArrowLeft,
  Search,
  X,
  Mic,
  Plus,
  MinusCircle,
  PlusCircle,
  ArrowRight,
} from "lucide-react-native";
import FormActionBar from "../../components/ui/FormActionBar";
import ScreenHeader from "../../components/layout/ScreenHeader";
import type { AppNavigationParamList } from "../../navigation/types";

const AVATAR_COLORS = [
  "#1DB954", // green
  "#2196F3", // blue
  "#FF5722", // deep orange
  "#9C27B0", // purple
  "#FF9800", // amber
  "#00BCD4", // cyan
];

function avatarColor(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const AddItemsScreen = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const route = useRoute<RouteProp<AppNavigationParamList, "AddItems">>();

  const { data: products = [] } = useProducts();
  const { lineItems, addItem, updateQuantity, removeLineItem } =
    useInvoiceStore();

  const [query, setQuery] = useState("");
  const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q),
    );
  }, [products, query]);

  const totalSelectedItems = lineItems.reduce((s, i) => s + i.quantity, 0);
  const totalSelectedAmount = lineItems.reduce((s, i) => s + i.total, 0);

  const getQty = (productId: string) =>
    lineItems.find((l) => l.product.id === productId)?.quantity ?? 0;

  const increment = (product: any) => {
    const existing = lineItems.find((l) => l.product.id === product.id);
    if (existing) {
      updateQuantity(existing.id, existing.quantity + 1);
    } else {
      addItem(product);
    }
  };

  const decrement = (product: any) => {
    const existing = lineItems.find((l) => l.product.id === product.id);
    if (!existing) return;
    if (existing.quantity === 1) {
      removeLineItem(existing.id);
    } else {
      updateQuantity(existing.id, existing.quantity - 1);
    }
  };

  const handleDone = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* ── Top App Bar ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={handleDone}
          style={styles.backBtn}
          accessibilityLabel="Back to invoice"
          hitSlop={hitSlop}
        >
          <ArrowLeft size={24} color={tokens.primary} strokeWidth={2.5} />
        </Pressable>
        {/* Search bar */}
        <View style={styles.searchBox}>
          <Search size={18} color={tokens.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by item name..."
            placeholderTextColor="rgba(115,115,115,0.5)"
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery("")}
              accessibilityLabel="Clear search"
              hitSlop={hitSlop}
            >
              <X size={16} color="rgba(115,115,115,0.5)" />
            </Pressable>
          )}
        </View>
        <Pressable
          style={styles.micBtn}
          accessibilityLabel="Voice search"
          hitSlop={hitSlop}
        >
          <Mic size={20} color={tokens.foreground} />
        </Pressable>
      </View>

      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* ── Create New Item ────────────────────────────────────────────── */}
            <Pressable
              style={styles.createCard}
              onPress={() => navigation.navigate("ProductForm")}
            >
              <View style={styles.createIconCircle}>
                <Plus size={20} color={tokens.primary} strokeWidth={3} />
              </View>
              <Text style={styles.createLabel}>+ Create New Item</Text>
            </Pressable>

            {/* ── Section Header ─────────────────────────────────────────────── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {query ? "SEARCH RESULTS" : "POPULAR ITEMS"}
              </Text>
              <Text style={styles.sectionCount}>{filtered.length} items</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubText}>Try a different search term</Text>
          </View>
        }
        renderItem={({ item: product }) => {
          const qty = getQty(product.id);
          const stockNum = product.stock_quantity ?? 0;
          const stockColor =
            stockNum < 0 ? tokens.destructive : tokens.mutedForeground;
          const color = avatarColor(product.name);

          return (
            <View style={styles.productCard}>
              {/* Avatar */}
              <View
                style={[styles.avatar, { backgroundColor: color + "18" }]}
              >
                <Text style={[styles.avatarText, { color }]}>
                  {getInitials(product.name)}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <View style={styles.productMeta}>
                  <Text style={styles.productPrice}>
                    {formatCurrency(product.selling_price)}/
                    {product.unit ?? "PCS"}
                  </Text>
                  <Text style={[styles.productStock, { color: stockColor }]}>
                    Stock: {stockNum}
                  </Text>
                </View>
              </View>

              {/* Stepper */}
              <View style={[styles.stepper, qty > 0 && styles.stepperActive]}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => decrement(product)}
                  accessibilityLabel={`Decrease quantity for ${product.name}`}
                  hitSlop={hitSlop}
                >
                  <MinusCircle
                    size={24}
                    color={
                      qty > 0 ? tokens.primary : 'rgba(115,115,115,0.38)'
                    }
                    strokeWidth={2}
                  />
                </Pressable>
                <Text
                  style={[
                    styles.stepperQty,
                    {
                      color:
                        qty > 0
                          ? tokens.foreground
                          : 'rgba(115,115,115,0.38)',
                    },
                  ]}
                >
                  {qty}
                </Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => increment(product)}
                  accessibilityLabel={`Increase quantity for ${product.name}`}
                  hitSlop={hitSlop}
                >
                  <PlusCircle
                    size={24}
                    color={tokens.primary}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 12 }} />}
      />

      {totalSelectedItems > 0 && (
        <FormActionBar
          variant="summary"
          itemsLabel={`${totalSelectedItems} item${totalSelectedItems !== 1 ? 's' : ''} selected`}
          amountLabel={formatCurrency(totalSelectedAmount)}
          primaryLabel="Add to Invoice"
          primaryIcon={<ArrowRight size={16} color={tokens.primaryForeground} strokeWidth={2.5} />}
          onPrimary={handleDone}
        />
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: tokens.background },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 10,
      backgroundColor: tokens.background,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    backBtn: { padding: 8, borderRadius: 8 },
    backIcon: { fontSize: 22, color: tokens.primary, fontWeight: "700" },
    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
    },
    searchPrefix: { fontSize: 16, color: tokens.mutedForeground },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: tokens.foreground,
      padding: 0,
    },
    clearIcon: {
      fontSize: 13,
      color: 'rgba(115,115,115,0.5)',
    },
    micBtn: { padding: 8, borderRadius: 8 },
    micIcon: { fontSize: 20 },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },

    // Create card
    createCard: {
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: 'rgba(29,185,84,0.35)',
      backgroundColor: 'rgba(29,185,84,0.04)',
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      gap: 4,
    },
    createIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(29,185,84,0.08)',
      alignItems: "center",
      justifyContent: "center",
    },
    createIconText: {
      fontSize: 18,
      color: tokens.primary,
      fontWeight: "700",
      lineHeight: 22,
    },
    createLabel: { fontSize: 13, fontWeight: "700", color: tokens.primary },

    // Section header
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 2,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: "800",
      color: tokens.mutedForeground,
      letterSpacing: 1.5,
      textTransform: "uppercase",
    },
    sectionCount: { fontSize: 11, color: 'rgba(115,115,115,0.5)' },

    // Product card
    productCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.card,
      borderRadius: 14,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
      shadowColor: tokens.foreground,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 15, fontWeight: "800" },
    productInfo: { flex: 1, gap: 2 },
    productName: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.foreground,
      lineHeight: 18,
    },
    productMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
    productPrice: { fontSize: 13, fontWeight: "700", color: tokens.primary },
    productStock: { fontSize: 11 },

    // Stepper
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.muted,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 4,
      gap: 6,
    },
    stepperActive: {
      backgroundColor: 'rgba(29,185,84,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(29,185,84,0.2)',
    },
    stepperBtn: { padding: 2 },
    stepperIcon: { fontSize: 20, lineHeight: 24 },
    stepperQty: {
      fontSize: 13,
      fontWeight: "800",
      minWidth: 18,
      textAlign: "center",
    },

    // Empty
    emptyState: { alignItems: "center", paddingVertical: 40 },
    emptyText: {
      fontSize: 15,
      fontWeight: "600",
      color: tokens.mutedForeground,
    },
    emptySubText: { fontSize: 12, color: tokens.mutedForeground, marginTop: 4 },

  });

export default AddItemsScreen;
