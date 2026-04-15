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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import { useInvoiceStore } from "../../stores/invoiceStore";
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
import InvoiceMetaStrip from "./components/InvoiceMetaStrip";
import BillToCard from "./components/BillToCard";
import InvoiceTotalsCard from "./components/InvoiceTotalsCard";
import InvoiceBottomBar from "./components/InvoiceBottomBar";
import { formatCurrency } from "../../utils/formatting";
import { ArrowLeft, MoreVertical, Search, ScanLine } from "lucide-react-native";
import type { InvoicesStackParamList } from "../../navigation/types";

type Mode = "sale" | "purchase";

const AddSaleScreen = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation =
    useNavigation<NativeStackNavigationProp<InvoicesStackParamList>>();
  const route = useRoute<RouteProp<InvoicesStackParamList, "AddSale">>();
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

  const { validate, submitInvoice, handleBack, handleScan, isSubmitting } =
    useInvoiceFlow({
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

  const handleDiscardInvoice = () => {
    Alert.alert(
      "Discard Invoice?",
      "This will remove all selected items and unsaved changes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            resetInvoice();
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleAppBarAction = () => {
    Alert.alert("More Options", "Choose an action", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard Invoice", style: "destructive", onPress: handleDiscardInvoice },
    ]);
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
          <Pressable onPress={handleAppBarAction} style={styles.appBarAction}>
            <MoreVertical
              size={22}
              color={tokens.mutedForeground}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Invoice Meta Strip */}
          <InvoiceMetaStrip
            isEditMode={isEditMode}
            invoiceId={invoiceId}
            invoiceDate={invoiceDate}
            tokens={tokens}
          />

          {/* 2. Bill To */}
          <BillToCard
            selectedClient={selectedClient}
            onOpenPartySheet={() => setPartySheetVisible(true)}
            tokens={tokens}
          />

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
          <Pressable style={styles.searchBar} onPress={openAddItems}>
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

          {/* 5, 6, 7. Totals Card (Adjustments, GST, Totals) */}
          <InvoiceTotalsCard
            chargeAmt={chargeAmt}
            discountAmt={discountAmt}
            roundOffAmt={roundOffAmt}
            adjustments={adjustments}
            taxAmount={taxAmount}
            cgst={cgst}
            sgst={sgst}
            finalTotal={finalTotal}
            amountReceived={amountReceived}
            balanceDue={balanceDue}
            onOpenAdjustments={() => setAdjustmentsSheetVisible(true)}
            formatCurrency={formatCurrency}
            tokens={tokens}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 8. Bottom CTA Bar */}
      <InvoiceBottomBar
        onDraft={handleBack}
        onGenerate={submitInvoice}
        isSubmitting={isSubmitting}
        isEditMode={isEditMode}
        tokens={tokens}
      />

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
      height: 64,
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
      paddingBottom: 24,
    },

    // Meta Strip removed and extracted to InvoiceMetaStrip

    // Card
    card: {
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 24,
      padding: 16,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    cardSectionLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: tokens.mutedForeground,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 12,
    },

    // Party styles extracted to BillToCard
    // Search Bar
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    searchIcon: { fontSize: 16, color: tokens.mutedForeground },
    searchInput: { flex: 1, fontSize: 14, color: tokens.foreground },
    scanIcon: { fontSize: 20, color: tokens.primary },
  });

export default AddSaleScreen;
