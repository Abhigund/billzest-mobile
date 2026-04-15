import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { ChevronRight, PlusCircle } from "lucide-react-native";
import { ThemeTokens } from "../../../theme/tokens";
import { AdjustmentValues } from "../../../components/modals/AdjustmentsBottomSheet";

interface InvoiceTotalsCardProps {
  chargeAmt: number;
  discountAmt: number;
  roundOffAmt: number;
  adjustments: Partial<AdjustmentValues>;
  taxAmount: number;
  cgst: number;
  sgst: number;
  finalTotal: number;
  amountReceived: number;
  balanceDue: number;
  onOpenAdjustments: () => void;
  formatCurrency: (val: number) => string;
  tokens: ThemeTokens;
}

const InvoiceTotalsCard: React.FC<InvoiceTotalsCardProps> = ({
  chargeAmt,
  discountAmt,
  roundOffAmt,
  adjustments,
  taxAmount,
  cgst,
  sgst,
  finalTotal,
  amountReceived,
  balanceDue,
  onOpenAdjustments,
  formatCurrency,
  tokens,
}) => {
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <>
      {/* 5. Adjustments Card */}
      <View style={styles.adjustmentsCard}>
        <Pressable style={styles.adjustmentRow} onPress={onOpenAdjustments}>
          <Text style={styles.adjustmentLabel}>
            {chargeAmt > 0
              ? `+ Additional Charges (${formatCurrency(chargeAmt)})`
              : "+ Additional Charges"}
          </Text>
          <ChevronRight size={20} color={tokens.mutedForeground} />
        </Pressable>
        <View style={styles.adjustmentDivider} />
        <Pressable style={styles.adjustmentRow} onPress={onOpenAdjustments}>
          <Text style={styles.adjustmentLabel}>
            {discountAmt > 0
              ? `+ Discount (−${formatCurrency(discountAmt)})`
              : "+ Discount"}
          </Text>
          <ChevronRight size={20} color={tokens.mutedForeground} />
        </Pressable>
        <View style={styles.adjustmentDivider} />
        <Pressable style={styles.adjustmentRow} onPress={onOpenAdjustments}>
          <Text style={styles.adjustmentLabel}>
            {adjustments.roundOff
              ? `+ Round Off (${roundOffAmt >= 0 ? "+" : ""}${formatCurrency(
                  roundOffAmt
                )})`
              : "+ Round Off"}
          </Text>
          <ChevronRight size={20} color={tokens.mutedForeground} />
        </Pressable>
      </View>

      {/* 6. GST Pills */}
      {taxAmount > 0 && (
        <View style={styles.gstStrip}>
          <View style={styles.gstPill}>
            <Text style={styles.gstPillLabel}>CGST 9%</Text>
            <Text style={styles.gstPillValue}>{formatCurrency(cgst)}</Text>
          </View>
          <View style={styles.gstPill}>
            <Text style={styles.gstPillLabel}>SGST 9%</Text>
            <Text style={styles.gstPillValue}>{formatCurrency(sgst)}</Text>
          </View>
        </View>
      )}

      {/* 7. Totals Card */}
      <View style={styles.totalCard}>
        <View style={styles.totalTopRow}>
          <Text style={styles.totalAmountLabel}>Total Amount</Text>
          <Text style={styles.totalAmountValue}>
            {formatCurrency(finalTotal)}
          </Text>
        </View>
        <View style={styles.totalDivider} />
        <Pressable
          style={styles.totalRow}
          onPress={() => Alert.alert("Record Payment", "Enter amount received.")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <PlusCircle size={14} color={tokens.primary} />
            <Text style={styles.amountReceivedLink}>Amount Received</Text>
          </View>
          <Text style={styles.amountReceivedValue}>
            {formatCurrency(amountReceived)}
          </Text>
        </Pressable>
        <View style={styles.totalRow}>
          <Text style={styles.balanceDueLabel}>Balance Due</Text>
          <Text style={styles.balanceDueValue}>{formatCurrency(balanceDue)}</Text>
        </View>
      </View>
    </>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    // Adjustments
    adjustmentsCard: {
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 24,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
      overflow: "hidden",
    },
    adjustmentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    adjustmentLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: tokens.mutedForeground,
    },
    adjustmentDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },

    // GST Pills
    gstStrip: { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
    gstPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(29,185,84,0.06)',
    },
    gstPillLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: tokens.primary,
      letterSpacing: 0.5,
    },
    gstPillValue: { fontSize: 11, fontWeight: "800", color: tokens.foreground },

    // Total Card
    totalCard: {
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 24,
      padding: 20,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
      gap: 12,
    },
    totalTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    totalAmountLabel: {
      fontSize: 14,
      color: tokens.mutedForeground,
      fontWeight: "500",
    },
    totalAmountValue: {
      fontSize: 26,
      fontWeight: "900",
      color: tokens.primary,
    },
    totalDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    amountReceivedLink: {
      fontSize: 13,
      fontWeight: "700",
      color: tokens.primary,
    },
    amountReceivedValue: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.foreground,
    },
    balanceDueLabel: { fontSize: 13, color: tokens.mutedForeground },
    balanceDueValue: {
      fontSize: 15,
      fontWeight: "900",
      color: tokens.destructive,
    },
  });

export default InvoiceTotalsCard;
