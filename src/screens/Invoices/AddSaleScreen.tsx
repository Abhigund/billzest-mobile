import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import { useInvoiceStore } from "../../stores/invoiceStore";
import ItemSelectionSheet from "../../components/modals/ItemSelectionSheet";
import BarcodeScanner from "../../components/Scanner/BarcodeScanner";
import SelectPartyBottomSheet from "../../components/modals/SelectPartyBottomSheet";
import AdjustmentsBottomSheet, {
  AdjustmentValues,
} from "../../components/modals/AdjustmentsBottomSheet";
import { useProducts } from "../../logic/productLogic";
import { useOrderDetail } from "../../logic/orderLogic";
import { useOrganization } from "../../contexts/OrganizationContext";
import { useInvoiceFlow } from "./hooks/useInvoiceFlow";
import InvoiceItemsList from "./components/InvoiceItemsList";
import Button from "../../components/ui/Button";
import {
  ArrowLeft,
  Settings,
  Edit2,
  User,
  ChevronDown,
  PlusCircle,
  Plus,
  Trash2,
  Minus,
  Search,
  ScanLine,
  ChevronRight,
  Inbox,
  Receipt,
} from "lucide-react-native";

type Mode = "sale" | "purchase";

const AddSaleScreen = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { data: products = [] } = useProducts();
  const { organizationId } = useOrganization();

  const initialMode: Mode =
    (route.params?.initialMode as Mode | undefined) ?? "sale";
  const [mode] = useState<Mode>(initialMode);

  const {
    selectedClient,
    lineItems,
    invoiceDate,
    mode: storedMode,
    addItem,
    updateQuantity,
    removeLineItem,
    setClient,
    setMode,
    resetInvoice,
  } = useInvoiceStore();

  // Check if we're in edit mode
  const invoiceId = route.params?.invoiceId as string | undefined;
  const isEditMode = !!invoiceId;
  const { data: existingInvoice } = useOrderDetail(invoiceId);

  // Load invoice data when in edit mode
  React.useEffect(() => {
    if (isEditMode && existingInvoice && products.length > 0) {
      const loadData = async () => {
        const partyId = existingInvoice.party_id;
        let party = null;
        if (partyId) {
          const { partiesService } =
            await import("../../supabase/partiesService");
          const fetchedParty = await partiesService.getPartyById(partyId);
          if (fetchedParty) {
            party = fetchedParty;
          } else {
            party = {
              id: partyId,
              organization_id: organizationId!,
              type: "customer" as const,
              name: existingInvoice.party?.name || "Customer",
              email: null,
              phone: null,
              address: null,
              notes: null,
              party_type: "customer" as const,
            };
          }
        }

        useInvoiceStore.getState().loadInvoiceData(
          {
            id: existingInvoice.id,
            party_id: existingInvoice.party_id || null,
            created_at: existingInvoice.created_at || new Date().toISOString(),
            invoice_items:
              existingInvoice.items?.map((i: any) => ({
                id: i.id,
                description: i.product_name || "",
                quantity: i.quantity,
                unit_price: i.unit_price,
                amount: i.total_price,
                gst_rate: i.gst_rate,
                product_id: i.product_id,
              })) || [],
          },
          party,
          products,
        );
      };
      loadData();
    }
  }, [isEditMode, existingInvoice, products]);

  // Reset store if mode doesn't match
  React.useEffect(() => {
    if (!isEditMode) {
      if (storedMode && storedMode !== mode) {
        resetInvoice();
        setMode(mode);
      } else if (!storedMode) {
        setMode(mode);
      }
    }
  }, [mode, storedMode, resetInvoice, setMode, isEditMode]);

  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const [isItemSheetVisible, setItemSheetVisible] = useState(false);
  const [isScannerVisible, setScannerVisible] = useState(false);

  const openAddItems = () => navigation.navigate("AddItems");
  // New Stitch UI state
  const [isPartySheetVisible, setPartySheetVisible] = useState(false);
  const [isAdjustmentsSheetVisible, setAdjustmentsSheetVisible] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustments, setAdjustments] = useState<Partial<AdjustmentValues>>({});
  const [amountReceived, setAmountReceived] = useState(0);

  // Request LayoutAnimation for item additions
  const addItemWithAnim = (product: any) => {
    if (Platform.OS === "android") {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    addItem(product);
  };

  // Derived totals
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.rate * item.quantity,
    0,
  );
  const taxAmount =
    mode === "sale"
      ? lineItems.reduce((sum, item) => sum + item.taxAmount, 0)
      : 0;
  const grandTotal = subtotal + taxAmount;
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;

  // Adjustment-derived values
  const chargeAmt = adjustments.chargeAmount ?? 0;
  const discountVal = adjustments.discountValue ?? 0;
  const discountAmt =
    adjustments.discountType === "percent"
      ? (grandTotal * discountVal) / 100
      : discountVal;
  const roundOffAmt = adjustments.roundOff
    ? Math.round(grandTotal) - grandTotal
    : 0;
  const finalTotal = grandTotal + chargeAmt - discountAmt + roundOffAmt;
  const balanceDue = finalTotal - amountReceived;

  const { validate, submitInvoice, handleBack, handleScan, isSubmitting } = useInvoiceFlow({
    finalTotal,
    subtotal,
    taxAmount,
    cgst,
    sgst,
    amountReceived,
    discountAmt,
    products,
    setScannerVisible,
    existingInvoice,
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);





  const getInitials = (name?: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("");
  };



  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* ── App Bar ──────────────────────────────────────────────────────────── */}
      <View style={styles.appBar}>
        <Pressable onPress={handleBack} style={styles.appBarBack}>
          <ArrowLeft size={24} color={tokens.primary} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.appBarTitle}>
          {isEditMode
            ? "Edit Invoice"
            : mode === "sale"
              ? "Create Invoice"
              : "Create Purchase"}
        </Text>
        <Pressable onPress={() => resetInvoice()} style={styles.appBarAction}>
          <Settings size={22} color={tokens.mutedForeground} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Invoice Meta Strip */}
        <View style={styles.metaStrip}>
          <View>
            <Text style={styles.metaInvoiceNo}>
              INVOICE #{isEditMode ? (invoiceId?.slice(-4) ?? "—") : "NEW"}
            </Text>
            <Text style={styles.metaDate}>
              {new Date(invoiceDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}{" "}
              • Due: 7 days
            </Text>
          </View>
          <Pressable style={styles.metaEditBtn} onPress={() => {}}>
            <Text style={styles.metaEditText}>EDIT </Text>
            <Edit2 size={12} color={tokens.primary} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* 2. Bill To */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>BILL TO</Text>
          <Pressable
            style={styles.partyRow}
            onPress={() => setPartySheetVisible(true)}
          >
            {selectedClient ? (
              <>
                <View style={styles.partyAvatar}>
                  <Text style={styles.partyAvatarText}>
                    {getInitials(selectedClient.name)}
                  </Text>
                </View>
                <View style={styles.partyInfo}>
                  <Text style={styles.partyName}>{selectedClient.name}</Text>
                  <Text style={styles.partyMeta}>
                    {(selectedClient as any).gstin ??
                      (selectedClient as any).gst_number ??
                      selectedClient.phone ??
                      "Tap to view details"}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.partyAvatar,
                    { backgroundColor: tokens.muted },
                  ]}
                >
                  <User size={20} color={tokens.mutedForeground} />
                </View>
                <View style={styles.partyInfo}>
                  <Text
                    style={[
                      styles.partyName,
                      { color: tokens.mutedForeground },
                    ]}
                  >
                    Select Party
                  </Text>
                  <Text style={styles.partyMeta}>
                    Tap to choose customer / vendor
                  </Text>
                </View>
              </>
            )}
            <ChevronDown size={20} color={tokens.mutedForeground} />
          </Pressable>
          <Pressable
            style={styles.editPartyLink}
            onPress={() => setPartySheetVisible(true)}
          >
            <PlusCircle size={14} color={tokens.primary} />
            <Text style={[styles.editPartyText, { marginLeft: 6 }]}>
              {selectedClient ? "Change Party" : "Select Party"}
            </Text>
          </Pressable>
        </View>

        {/* 3. Items */}
        <InvoiceItemsList
          lineItems={lineItems}
          subtotal={subtotal}
          updateQuantity={updateQuantity}
          removeLineItem={removeLineItem}
          onAddItems={openAddItems}
          formatCurrency={formatCurrency}
          tokens={tokens}
        />

        {/* 4. Search Bar */}
        <Pressable style={styles.searchBar} onPress={() => openAddItems()}>
          <Search size={18} color={tokens.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search or scan item..."
            placeholderTextColor={tokens.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={openAddItems}
          />
          <Pressable onPress={() => setScannerVisible(true)}>
            <ScanLine size={20} color={tokens.primary} />
          </Pressable>
        </Pressable>

        {/* 5. Adjustments Card */}
        <View style={styles.adjustmentsCard}>
          <Pressable
            style={styles.adjustmentRow}
            onPress={() => setAdjustmentsSheetVisible(true)}
          >
            <Text style={styles.adjustmentLabel}>
              {chargeAmt > 0
                ? `+ Additional Charges (${formatCurrency(chargeAmt)})`
                : "+ Additional Charges"}
            </Text>
            <ChevronRight size={20} color={tokens.mutedForeground} />
          </Pressable>
          <View style={styles.adjustmentDivider} />
          <Pressable
            style={styles.adjustmentRow}
            onPress={() => setAdjustmentsSheetVisible(true)}
          >
            <Text style={styles.adjustmentLabel}>
              {discountAmt > 0
                ? `+ Discount (−${formatCurrency(discountAmt)})`
                : "+ Discount"}
            </Text>
            <ChevronRight size={20} color={tokens.mutedForeground} />
          </Pressable>
          <View style={styles.adjustmentDivider} />
          <Pressable
            style={styles.adjustmentRow}
            onPress={() => setAdjustmentsSheetVisible(true)}
          >
            <Text style={styles.adjustmentLabel}>
              {adjustments.roundOff
                ? `+ Round Off (${roundOffAmt >= 0 ? "+" : ""}${formatCurrency(roundOffAmt)})`
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
            onPress={() =>
              Alert.alert("Record Payment", "Enter amount received.")
            }
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <PlusCircle size={14} color={tokens.primary} />
              <Text style={styles.amountReceivedLink}>Amount Received</Text>
            </View>
            <Text style={styles.amountReceivedValue}>
              {formatCurrency(amountReceived)}
            </Text>
          </Pressable>
          <View style={styles.totalRow}>
            <Text style={styles.balanceDueLabel}>Balance Due</Text>
            <Text style={styles.balanceDueValue}>
              {formatCurrency(balanceDue)}
            </Text>
          </View>
        </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* 8. Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <Pressable style={styles.draftButton} onPress={handleBack}>
            <Inbox size={18} color={tokens.primary} />
            <Text style={styles.draftText}>Save Draft</Text>
          </Pressable>
          <Pressable
            style={[
              styles.generateButton,
              isSubmitting && { opacity: 0.7 },
            ]}
            onPress={submitInvoice}
            disabled={isSubmitting}
          >
            <Receipt size={18} color="#fff" />
            <Text style={styles.generateText}>
              {isSubmitting
                ? "Saving…"
                : isEditMode
                  ? "Update Bill"
                  : "Generate Bill"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Sheets & Modals */}
      <SelectPartyBottomSheet
        visible={isPartySheetVisible}
        onClose={() => setPartySheetVisible(false)}
        onSelectParty={(party) => {
          setClient(party);
          setPartySheetVisible(false);
        }}
        selectedPartyId={selectedClient?.id}
        mode={mode}
      />

      <AdjustmentsBottomSheet
        visible={isAdjustmentsSheetVisible}
        onClose={() => setAdjustmentsSheetVisible(false)}
        onSave={(vals) => setAdjustments(vals)}
        initialValues={adjustments as AdjustmentValues}
        invoiceNumber={isEditMode ? (invoiceId ?? "INV-EDIT") : "INV-NEW"}
        totalAmount={grandTotal}
      />

      <ItemSelectionSheet
        visible={isItemSheetVisible}
        onClose={() => setItemSheetVisible(false)}
        onSelectProduct={addItemWithAnim}
        onUpdateQuantity={(productId, delta) => {
          const lineItem = lineItems.find(
            (item) => item.product.id === productId,
          );
          if (lineItem) {
            const newQty = lineItem.quantity + delta;
            if (newQty > 0) {
              updateQuantity(lineItem.id, newQty);
            } else {
              removeLineItem(lineItem.id);
            }
          } else if (delta > 0) {
            const product = products.find((p) => p.id === productId);
            if (product) addItemWithAnim(product);
          }
        }}
        currentLineItems={lineItems}
      />

      <Modal
        visible={isScannerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <BarcodeScanner
          onCodeScanned={handleScan}
          onClose={() => setScannerVisible(false)}
          itemsCount={lineItems.length}
          totalAmount={grandTotal}
        />
      </Modal>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.background },

    // App Bar
    appBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      height: 60,
      backgroundColor: tokens.background,
    },
    appBarBack: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    appBarBackIcon: { fontSize: 22, color: tokens.primary },
    appBarTitle: { fontSize: 17, fontWeight: "700", color: tokens.foreground },
    appBarAction: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    appBarActionIcon: { fontSize: 20, color: tokens.mutedForeground },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 12,
      paddingBottom: 120,
    },

    // Meta Strip
    metaStrip: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    metaInvoiceNo: {
      fontSize: 11,
      fontWeight: "700",
      color: tokens.mutedForeground,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    metaDate: { fontSize: 11, color: tokens.mutedForeground, marginTop: 2 },
    metaEditBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.primary + "50",
      backgroundColor: tokens.primary + "08",
    },
    metaEditText: { fontSize: 11, fontWeight: "700", color: tokens.primary },

    // Card
    card: {
      backgroundColor: tokens.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border + "20",
      shadowColor: "#1a1a2e",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    cardSectionLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: tokens.mutedForeground,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 12,
    },

    // Party
    partyRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.muted,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: tokens.border + "18",
    },
    partyAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: tokens.primary + "18",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    partyAvatarText: { fontSize: 14, fontWeight: "700", color: tokens.primary },
    partyInfo: { flex: 1 },
    partyName: { fontSize: 15, fontWeight: "700", color: tokens.foreground },
    partyMeta: { fontSize: 11, color: tokens.mutedForeground, marginTop: 2 },
    expandIcon: { fontSize: 18, color: tokens.mutedForeground },
    editPartyLink: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
    },
    editPartyText: { fontSize: 13, fontWeight: "600", color: tokens.primary },

    // Search Bar
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.muted,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: tokens.border + "10",
      gap: 10,
    },
    searchIcon: { fontSize: 16, color: tokens.mutedForeground },
    searchInput: { flex: 1, fontSize: 14, color: tokens.foreground },
    scanIcon: { fontSize: 20, color: tokens.primary },

    // Adjustments
    adjustmentsCard: {
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
    adjustmentChevron: {
      fontSize: 20,
      color: tokens.mutedForeground,
      fontWeight: "300",
    },
    adjustmentDivider: { height: 1, backgroundColor: tokens.border + "10" },

    // GST Pills
    gstStrip: { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
    gstPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: tokens.primary + "10",
      borderWidth: 1,
      borderColor: tokens.primary + "25",
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
      backgroundColor: tokens.card,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: tokens.border + "20",
      borderLeftWidth: 4,
      borderLeftColor: tokens.primary,
      shadowColor: "#1a1a2e",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
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
    totalDivider: { height: 1, backgroundColor: tokens.border + "18" },
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

    // Bottom Bar
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: tokens.card + "E0",
      borderTopWidth: 1,
      borderTopColor: tokens.border + "20",
      paddingBottom: 28,
    },
    bottomBarInner: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    draftButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: tokens.primary + "40",
      borderRadius: 14,
      paddingVertical: 14,
    },
    draftIcon: { fontSize: 18, color: tokens.primary },
    draftText: { fontSize: 14, fontWeight: "600", color: tokens.primary },
    generateButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: tokens.primary,
      borderRadius: 14,
      paddingVertical: 14,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    generateIcon: { fontSize: 18, color: tokens.primaryForeground },
    generateText: {
      fontSize: 14,
      fontWeight: "700",
      color: tokens.primaryForeground,
    },
  });

export default AddSaleScreen;
