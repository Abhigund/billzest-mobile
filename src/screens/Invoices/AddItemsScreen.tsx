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
import type { NavigationProp } from "@react-navigation/native";
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
  const route = useRoute<any>();

  const { data: products = [] } = useProducts();
  const { lineItems, addItem, updateQuantity, removeLineItem } =
    useInvoiceStore();

  const [query, setQuery] = useState("");

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
        <Pressable onPress={handleDone} style={styles.backBtn}>
          <ArrowLeft size={24} color={tokens.primary} strokeWidth={2.5} />
        </Pressable>
        {/* Search bar */}
        <View style={styles.searchBox}>
          <Search size={18} color={tokens.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by item name..."
            placeholderTextColor={tokens.mutedForeground + "80"}
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <X size={16} color={tokens.mutedForeground + "80"} />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.micBtn}>
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
                >
                  <MinusCircle
                    size={24}
                    color={
                      qty > 0 ? tokens.primary : tokens.mutedForeground + "60"
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
                          : tokens.mutedForeground + "60",
                    },
                  ]}
                >
                  {qty}
                </Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => increment(product)}
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
        ListFooterComponent={<View style={{ height: 90 }} />}
      />

      {/* ── Bottom Summary Bar ─────────────────────────────────────────────── */}
      {totalSelectedItems > 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>SUMMARY</Text>
            <View style={styles.footerRow}>
              <Text style={styles.footerItems}>{totalSelectedItems} items</Text>
              <Text style={styles.footerSep}> | </Text>
              <Text style={styles.footerAmount}>
                {formatCurrency(totalSelectedAmount)}
              </Text>
            </View>
          </View>
          <Pressable style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneBtnText}>Add to Invoice</Text>
            <ArrowRight size={18} color={tokens.primaryForeground} strokeWidth={2.5} />
          </Pressable>
        </View>
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
      borderBottomColor: tokens.border + "15",
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
      borderColor: tokens.border + "15",
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
      color: tokens.mutedForeground + "80",
      padding: 2,
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
      borderColor: tokens.primary + "50",
      backgroundColor: tokens.primary + "06",
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      gap: 4,
    },
    createIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: tokens.primary + "12",
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
    sectionCount: { fontSize: 11, color: tokens.mutedForeground + "80" },

    // Product card
    productCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.card,
      borderRadius: 14,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: tokens.border + "15",
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
      backgroundColor: tokens.primary + "10",
      borderWidth: 1,
      borderColor: tokens.primary + "30",
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

    // Footer
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: tokens.card + "F0",
      borderTopWidth: 1,
      borderTopColor: tokens.border + "20",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 26,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: tokens.mutedForeground,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    footerRow: { flexDirection: "row", alignItems: "baseline", marginTop: 2 },
    footerItems: { fontSize: 14, fontWeight: "700", color: tokens.foreground },
    footerSep: {
      fontSize: 14,
      color: tokens.mutedForeground + "60",
      marginHorizontal: 4,
    },
    footerAmount: { fontSize: 18, fontWeight: "900", color: tokens.primary },
    doneBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: tokens.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    doneBtnText: { fontSize: 14, fontWeight: "700", color: tokens.primaryForeground },
  });

export default AddItemsScreen;
