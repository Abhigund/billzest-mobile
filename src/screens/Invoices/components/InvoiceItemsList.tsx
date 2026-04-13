import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Plus, Trash2, Minus } from "lucide-react-native";
import { ThemeTokens } from "../../../theme/tokens";

export interface InvoiceItemsListProps {
  lineItems: any[];
  subtotal: number;
  updateQuantity: (id: string, qty: number) => void;
  removeLineItem: (id: string) => void;
  onAddItems: () => void;
  formatCurrency: (val: number) => string;
  tokens: ThemeTokens;
}

const InvoiceItemsList: React.FC<InvoiceItemsListProps> = ({
  lineItems,
  subtotal,
  updateQuantity,
  removeLineItem,
  onAddItems,
  formatCurrency,
  tokens,
}) => {
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.itemsCard}>
      <View style={styles.itemsHeader}>
        <Text style={styles.itemsHeaderTitle}>ITEMS ({lineItems.length})</Text>
        <Pressable style={styles.addItemBtn} onPress={onAddItems}>
          <Plus size={16} color={tokens.primary} strokeWidth={2.5} />
          <Text style={[styles.addItemBtnText, { marginLeft: 4 }]}>
            Add Item
          </Text>
        </Pressable>
      </View>
      <View style={styles.itemsList}>
        {lineItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items yet</Text>
            <Text style={styles.emptySubText}>
              Search or scan to add products
            </Text>
          </View>
        ) : (
          lineItems.map((item) => (
            <View key={item.id} style={styles.lineItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineItemName}>{item.product.name}</Text>
                <Text style={styles.lineItemMeta}>
                  {item.quantity} × {formatCurrency(item.rate)}
                </Text>
              </View>
              <View style={styles.lineItemRight}>
                <Text style={styles.lineItemTotal}>
                  {formatCurrency(item.total)}
                </Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() =>
                      item.quantity === 1
                        ? removeLineItem(item.id)
                        : updateQuantity(item.id, item.quantity - 1)
                    }
                  >
                    {item.quantity === 1 ? (
                      <Trash2 size={16} color={tokens.destructive} />
                    ) : (
                      <Minus
                        size={16}
                        color={tokens.primary}
                        strokeWidth={2.5}
                      />
                    )}
                  </Pressable>
                  <Text style={styles.stepperQty}>{item.quantity}</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={16} color={tokens.primary} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
        {lineItems.length > 0 && (
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Item Subtotal</Text>
            <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    itemsCard: {
      backgroundColor: tokens.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: tokens.border + "20",
      shadowColor: "#1a1a2e",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
      overflow: "hidden",
    },
    itemsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border + "10",
    },
    itemsHeaderTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: tokens.foreground,
      letterSpacing: 0.3,
    },
    addItemBtn: { flexDirection: "row", alignItems: "center" },
    addItemBtnText: { fontSize: 13, fontWeight: "700", color: tokens.primary },
    itemsList: { paddingHorizontal: 16, paddingBottom: 8 },
    lineItemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border + "10",
      gap: 8,
    },
    lineItemName: { fontSize: 14, fontWeight: "700", color: tokens.foreground },
    lineItemMeta: { fontSize: 12, color: tokens.mutedForeground, marginTop: 2 },
    lineItemRight: { alignItems: "flex-end", gap: 6 },
    lineItemTotal: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.foreground,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.muted,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 3,
      gap: 6,
    },
    stepperBtn: { paddingHorizontal: 4, paddingVertical: 2 },
    stepperQty: {
      fontSize: 13,
      fontWeight: "700",
      color: tokens.foreground,
      minWidth: 20,
      textAlign: "center",
    },
    subtotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: tokens.border + "10",
      marginTop: 4,
    },
    subtotalLabel: { fontSize: 13, color: tokens.mutedForeground },
    subtotalValue: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.foreground,
    },
    emptyState: { alignItems: "center", paddingVertical: 24 },
    emptyText: {
      fontSize: 14,
      fontWeight: "600",
      color: tokens.mutedForeground,
    },
    emptySubText: { fontSize: 12, color: tokens.mutedForeground, marginTop: 4 },
  });

export default InvoiceItemsList;
