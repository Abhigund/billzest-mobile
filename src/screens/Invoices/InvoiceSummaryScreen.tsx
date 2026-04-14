import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import { ArrowLeft, PlusCircle, Plus } from "lucide-react-native";
import type { AppNavigationParamList } from "../../navigation/types";

type InvoiceSummaryRouteParams = {
  invoiceId?: string;
  invoiceNumber?: string;
  subtotal?: number;
  discount?: number;
  cgst?: number;
  sgst?: number;
  totalAmount?: number;
  amountReceived?: number;
  dueDate?: string;
};

const InvoiceSummaryScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const route = useRoute<any>();

  const params: InvoiceSummaryRouteParams = route.params ?? {};

  const {
    invoiceId,
    invoiceNumber = "#INV-0001",
    subtotal = 0,
    discount = 0,
    cgst = 0,
    sgst = 0,
    totalAmount = 0,
    amountReceived = 0,
    dueDate,
  } = params;

  const balanceDue = totalAmount - amountReceived;
  const dueDateDisplay = dueDate
    ? new Date(dueDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const handleCreateNew = () => {
    // Reset and go back to AddSale
    navigation.navigate("AddSale");
  };

  const handleGoBack = () => {
    if (invoiceId) {
      navigation.navigate("InvoiceDetail", { orderId: invoiceId });
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleGoBack}>
          <ArrowLeft size={24} color={tokens.primary} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Invoice Summary</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Summary Card */}
        <View style={styles.summaryCard}>
          {/* Line Items Section */}
          <View style={styles.lineItems}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(subtotal)}
              </Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: "#008545" }]}>
                  –{formatCurrency(discount)}
                </Text>
              </View>
            )}
            {cgst > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST 9%</Text>
                <Text style={styles.summaryValue}>{formatCurrency(cgst)}</Text>
              </View>
            )}
            {sgst > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SGST 9%</Text>
                <Text style={styles.summaryValue}>{formatCurrency(sgst)}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Totals Section */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>

            {/* Amount Received */}
            <Pressable
              style={styles.amountReceivedRow}
              onPress={() =>
                Alert.alert("Record Payment", "Feature coming soon")
              }
            >
              <View style={styles.amountReceivedLeft}>
                <PlusCircle size={16} color={tokens.primary} />
                <Text style={styles.amountReceivedLabel}>Amount Received</Text>
              </View>
              <Text style={styles.amountReceivedValue}>
                {formatCurrency(amountReceived)}
              </Text>
            </Pressable>

            {/* Balance Due */}
            <View style={styles.balanceDueRow}>
              <Text style={styles.balanceDueLabel}>Balance Due</Text>
              <Text style={styles.balanceDueValue}>
                {formatCurrency(balanceDue)}
              </Text>
            </View>
          </View>
        </View>

        {/* Meta Cards */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCard}>
            <Text style={styles.metaCardLabel}>INVOICE ID</Text>
            <Text style={styles.metaCardValue}>{invoiceNumber}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaCardLabel}>DUE DATE</Text>
            <Text style={styles.metaCardValue}>{dueDateDisplay}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <Pressable style={styles.goBackButton} onPress={handleGoBack}>
            <ArrowLeft
              size={20}
              color={tokens.mutedForeground}
              strokeWidth={2.5}
            />
            <Text style={styles.goBackText}>Go Back</Text>
          </Pressable>
          <Pressable style={styles.createNewButton} onPress={handleCreateNew}>
            <Plus size={18} color={tokens.primaryForeground} strokeWidth={3} />
            <Text style={styles.createNewText}>Create New Invoice</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      height: 64,
      backgroundColor: tokens.background,
      borderBottomWidth: 0,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    backIcon: {
      fontSize: 22,
      color: tokens.primary,
      fontWeight: "600",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: tokens.foreground,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
    },
    summaryCard: {
      backgroundColor: tokens.card,
      borderRadius: 14,
      padding: 20,
      borderWidth: 1,
      borderColor: tokens.border + "30",
      shadowColor: "#1a1a2e",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      gap: 16,
    },
    lineItems: {
      gap: 14,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryLabel: {
      fontSize: 14,
      color: tokens.mutedForeground,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: "600",
      color: tokens.foreground,
    },
    divider: {
      height: 1,
      backgroundColor: tokens.border + "33",
    },
    totalsSection: {
      gap: 12,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    totalLabel: {
      fontSize: 17,
      fontWeight: "700",
      color: tokens.foreground,
    },
    totalValue: {
      fontSize: 24,
      fontWeight: "800",
      color: tokens.primary,
    },
    amountReceivedRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    amountReceivedLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    addIcon: {
      fontSize: 14,
      color: tokens.primary,
      fontWeight: "600",
    },
    amountReceivedLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.primary,
      textDecorationLine: "underline",
    },
    amountReceivedValue: {
      fontSize: 14,
      fontWeight: "600",
      color: tokens.foreground,
    },
    balanceDueRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: tokens.destructive + "18",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.destructive + "40",
    },
    balanceDueLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.destructive,
    },
    balanceDueValue: {
      fontSize: 17,
      fontWeight: "800",
      color: tokens.destructive,
    },
    metaGrid: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    metaCard: {
      flex: 1,
      backgroundColor: tokens.muted,
      borderRadius: 14,
      padding: 16,
    },
    metaCardLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: tokens.mutedForeground,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    metaCardValue: {
      fontSize: 15,
      fontWeight: "700",
      color: tokens.foreground,
    },
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: tokens.card + "CC",
      borderTopWidth: 1,
      borderTopColor: tokens.border + "30",
      paddingBottom: 24,
    },
    bottomBarInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 14,
      gap: 12,
    },
    goBackButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 14,
      gap: 4,
    },
    goBackIcon: {
      fontSize: 20,
      color: tokens.mutedForeground,
    },
    goBackText: {
      fontSize: 15,
      fontWeight: "600",
      color: tokens.mutedForeground,
    },
    createNewButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.primary,
      borderRadius: 14,
      paddingVertical: 16,
      gap: 8,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    createNewIcon: {
      fontSize: 18,
      color: tokens.primaryForeground,
      fontWeight: "700",
    },
    createNewText: {
      fontSize: 15,
      fontWeight: "700",
      color: tokens.primaryForeground,
    },
  });

export default InvoiceSummaryScreen;
