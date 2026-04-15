import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import {
  X,
  Plus,
  Tag,
  Settings,
  Landmark,
  ChevronDown,
  Check,
} from "lucide-react-native";

export type AdjustmentValues = {
  chargeName: string;
  chargeAmount: number;
  discountType: "flat" | "percent";
  discountValue: number;
  roundOff: boolean;
  tcsRate: string;
};

type AdjustmentsBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (values: AdjustmentValues) => void;
  initialValues?: Partial<AdjustmentValues>;
  invoiceNumber?: string;
  totalAmount?: number;
};

const TCS_OPTIONS = [
  { label: "None", value: "none" },
  { label: "0.1% (with PAN)", value: "0.1" },
  { label: "1.0% (No PAN)", value: "1.0" },
];

const AdjustmentsBottomSheet: React.FC<AdjustmentsBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialValues,
  invoiceNumber = "INV-0001",
  totalAmount = 0,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  const [chargeName, setChargeName] = useState(initialValues?.chargeName ?? "");
  const [chargeAmount, setChargeAmount] = useState(
    initialValues?.chargeAmount?.toString() ?? "",
  );
  const [discountType, setDiscountType] = useState<"flat" | "percent">(
    initialValues?.discountType ?? "flat",
  );
  const [discountValue, setDiscountValue] = useState(
    initialValues?.discountValue?.toString() ?? "",
  );
  const [roundOff, setRoundOff] = useState(initialValues?.roundOff ?? false);
  const [tcsRate, setTcsRate] = useState(initialValues?.tcsRate ?? "none");
  const [showTcsPicker, setShowTcsPicker] = useState(false);

  // Sync with initialValues when sheet opens
  useEffect(() => {
    if (visible) {
      setChargeName(initialValues?.chargeName ?? "");
      setChargeAmount(initialValues?.chargeAmount?.toString() ?? "");
      setDiscountType(initialValues?.discountType ?? "flat");
      setDiscountValue(initialValues?.discountValue?.toString() ?? "");
      setRoundOff(initialValues?.roundOff ?? false);
      setTcsRate(initialValues?.tcsRate ?? "none");
    }
  }, [visible, initialValues]);

  // Compute summary
  const chargeAmt = parseFloat(chargeAmount) || 0;
  const discAmt =
    discountType === "flat"
      ? parseFloat(discountValue) || 0
      : (totalAmount * (parseFloat(discountValue) || 0)) / 100;
  const roundOffAmt = roundOff ? Math.round(totalAmount) - totalAmount : 0;
  const tcsFactor = tcsRate !== "none" ? parseFloat(tcsRate) / 100 : 0;
  const adjustments = chargeAmt - discAmt + roundOffAmt;
  const finalPayable = totalAmount + adjustments + totalAmount * tcsFactor;

  const handleSave = () => {
    onSave({
      chargeName,
      chargeAmount: chargeAmt,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      roundOff,
      tcsRate,
    });
    onClose();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayBackdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          {/* Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Adjustments</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={20} color={tokens.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Invoice Summary Strip */}
            <View style={styles.summaryStrip}>
              <View>
                <Text style={styles.stripLabel}>INVOICE</Text>
                <Text style={styles.stripInvoiceNo}>{invoiceNumber}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.stripLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.stripTotal}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>

            {/* Additional Charges */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Plus
                  size={18}
                  color={tokens.primary}
                  strokeWidth={2.5}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.sectionTitle}>ADDITIONAL CHARGES</Text>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Charge Name</Text>
                <TextInput
                  style={styles.input}
                  value={chargeName}
                  onChangeText={setChargeName}
                  placeholder="e.g. Shipping & Handling"
                  placeholderTextColor={tokens.mutedForeground}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <View style={styles.currencyInputRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={chargeAmount}
                    onChangeText={setChargeAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={tokens.mutedForeground}
                  />
                </View>
              </View>
            </View>

            {/* Discount */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRowBetween}>
                <View style={styles.sectionTitleRow}>
                  <Tag
                    size={18}
                    color={tokens.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sectionTitle}>DISCOUNT</Text>
                </View>
                {/* Toggle */}
                <View style={styles.toggleRow}>
                  <Pressable
                    style={[
                      styles.toggleBtn,
                      discountType === "flat" && styles.toggleBtnActive,
                    ]}
                    onPress={() => setDiscountType("flat")}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        discountType === "flat" && styles.toggleBtnTextActive,
                      ]}
                    >
                      FLAT ₹
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.toggleBtn,
                      discountType === "percent" && styles.toggleBtnActive,
                    ]}
                    onPress={() => setDiscountType("percent")}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        discountType === "percent" &&
                          styles.toggleBtnTextActive,
                      ]}
                    >
                      % OFF
                    </Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {discountType === "flat" ? "Discount Amount" : "Discount %"}
                </Text>
                <View style={styles.currencyInputRow}>
                  <Text style={styles.currencySymbol}>
                    {discountType === "flat" ? "₹" : "%"}
                  </Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={tokens.mutedForeground}
                  />
                </View>
              </View>
            </View>

            {/* Round Off */}
            <View style={styles.toggleRowCard}>
              <View style={styles.toggleRowLeft}>
                <View style={styles.iconCircle}>
                  <Settings size={20} color={tokens.foreground} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Round Off</Text>
                  <Text style={styles.rowSubtitle}>
                    {roundOff ? `+ ₹ ${roundOffAmt.toFixed(2)}` : "Not applied"}
                  </Text>
                </View>
              </View>
              <Switch
                value={roundOff}
                onValueChange={setRoundOff}
                trackColor={{ false: tokens.border, true: tokens.primary }}
                thumbColor={tokens.primaryForeground}
              />
            </View>

            {/* Apply TCS */}
            <View style={styles.toggleRowCard}>
              <View style={styles.toggleRowLeft}>
                <View style={styles.iconCircle}>
                  <Landmark size={20} color={tokens.foreground} />
                </View>
                <Text style={styles.rowTitle}>Apply TCS</Text>
              </View>
              <Pressable
                style={styles.tcsSelector}
                onPress={() => setShowTcsPicker((v) => !v)}
              >
                <Text style={styles.tcsSelectorText}>
                  {TCS_OPTIONS.find((o) => o.value === tcsRate)?.label ??
                    "None"}
                </Text>
                <ChevronDown size={16} color={tokens.primary} />
              </Pressable>
            </View>
            {showTcsPicker && (
              <View style={styles.tcsPicker}>
                {TCS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.tcsOption,
                      opt.value === tcsRate && styles.tcsOptionActive,
                    ]}
                    onPress={() => {
                      setTcsRate(opt.value);
                      setShowTcsPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.tcsOptionText,
                        opt.value === tcsRate && styles.tcsOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Summary Block */}
            <View style={styles.summaryBlock}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Adjustments</Text>
                <Text style={[styles.summaryValue, { color: tokens.primary }]}>
                  {adjustments >= 0 ? "+" : ""}
                  {formatCurrency(adjustments)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryFinalLabel}>Final Payable</Text>
                <Text style={styles.summaryFinalValue}>
                  {formatCurrency(finalPayable)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Check
                  size={18}
                  color={tokens.primaryForeground}
                  strokeWidth={2.5}
                />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(25, 28, 29, 0.5)",
    },
    overlayBackdrop: {
      flex: 1,
    },
    sheet: {
      backgroundColor: tokens.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "92%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -12 },
      shadowOpacity: 0.12,
      shadowRadius: 32,
      elevation: 20,
    },
    dragHandleContainer: {
      alignItems: "center",
      paddingTop: 12,
      paddingBottom: 4,
    },
    dragHandle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: tokens.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: tokens.card,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: tokens.foreground,
      letterSpacing: -0.3,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: tokens.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    closeIcon: {
      fontSize: 14,
      color: tokens.mutedForeground,
      fontWeight: "600",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    summaryStrip: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingVertical: 20,
      marginBottom: 8,
    },
    stripLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: tokens.mutedForeground,
      letterSpacing: 1,
      marginBottom: 4,
    },
    stripInvoiceNo: {
      fontSize: 18,
      fontWeight: "800",
      color: tokens.foreground,
    },
    stripTotal: {
      fontSize: 22,
      fontWeight: "800",
      color: tokens.primary,
    },
    section: {
      backgroundColor: tokens.background,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },
    sectionTitleRowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    sectionIcon: {
      fontSize: 16,
      color: tokens.primary,
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: tokens.foreground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    fieldGroup: {
      marginBottom: 12,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: tokens.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      marginLeft: 4,
    },
    input: {
      backgroundColor: tokens.muted,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: tokens.foreground,
    },
    currencyInputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.muted,
      borderRadius: 12,
      paddingHorizontal: 14,
    },
    currencySymbol: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.mutedForeground,
      marginRight: 6,
    },
    toggleRow: {
      flexDirection: "row",
      backgroundColor: tokens.muted,
      borderRadius: 10,
      padding: 3,
    },
    toggleBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    toggleBtnActive: {
      backgroundColor: tokens.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleBtnText: {
      fontSize: 10,
      fontWeight: "700",
      color: tokens.mutedForeground,
    },
    toggleBtnTextActive: {
      color: tokens.primary,
    },
    toggleRowCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: tokens.muted,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    toggleRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: tokens.card,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: {
      fontSize: 16,
    },
    rowTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.foreground,
    },
    rowSubtitle: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 2,
    },
    tcsSelector: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    tcsSelectorText: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.primary,
    },
    tcsChevron: {
      fontSize: 14,
      color: tokens.primary,
    },
    tcsPicker: {
      backgroundColor: tokens.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 10,
      overflow: "hidden",
    },
    tcsOption: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    tcsOptionActive: {
      backgroundColor: tokens.primaryAlpha10,
    },
    tcsOptionText: {
      fontSize: 14,
      color: tokens.foreground,
    },
    tcsOptionTextActive: {
      color: tokens.primary,
      fontWeight: "700",
    },
    summaryBlock: {
      backgroundColor: tokens.muted,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 13,
      color: tokens.mutedForeground,
      fontWeight: "500",
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: "700",
      color: tokens.foreground,
    },
    summaryDivider: {
      height: 1,
      borderStyle: "dashed",
      borderWidth: 1,
      borderColor: tokens.border,
      marginVertical: 8,
    },
    summaryFinalLabel: {
      fontSize: 15,
      fontWeight: "800",
      color: tokens.foreground,
    },
    summaryFinalValue: {
      fontSize: 20,
      fontWeight: "900",
      color: tokens.foreground,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: 32,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.08)',
      backgroundColor: tokens.card,
    },
    cancelButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 14,
    },
    cancelText: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    saveButton: {
      backgroundColor: tokens.primary,
      borderRadius: 14,
      paddingHorizontal: 28,
      paddingVertical: 14,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    saveButtonText: {
      color: tokens.primaryForeground,
      fontSize: 14,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });

export default AdjustmentsBottomSheet;
