import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Share,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import DetailHeader from "../../components/DetailHeader";
import {
  Share2,
  MessageCircle,
  Phone,
  Bell,
  MapPin,
  ReceiptText,
  Edit2,
  Trash2,
} from "lucide-react-native";
import DetailRow from "../../components/ui/DetailRow";
import Button from "../../components/ui/Button";
import {
  useCustomerFinancialSummary,
  useClientMutations,
} from "../../logic/partyLogic";
import { CustomersStackParamList } from "../../navigation/types";
import { useQuery } from "@tanstack/react-query";
import { partiesService } from "../../supabase/partiesService";

type CustomerProfile = {
  id: string;
  name: string;
  businessType: string;
  location: string;
  phone: string;
  dueAmount: number;
  totalSale: number;
  lastInvoice: string;
};

type CustomerDetailRoute = RouteProp<CustomersStackParamList, "CustomerDetail">;

const EMPTY_CUSTOMER: CustomerProfile = {
  id: "",
  name: "",
  businessType: "",
  location: "",
  phone: "",
  dueAmount: 0,
  totalSale: 0,
  lastInvoice: "",
};

const ACTIVITY_LOG: {
  id: string;
  label: string;
  meta: string;
  amount: string;
}[] = [];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const CREDIT_ENTRIES: {
  id: string;
  invoice: string;
  amount: number;
  dueDate: string;
  status: string;
}[] = [];

const RECENT_INVOICES: {
  id: string;
  invoice: string;
  total: number;
  status: string;
  issuedOn: string;
}[] = [];

const CustomerDetailScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation =
    useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const route = useRoute<CustomerDetailRoute>();
  const customerId =
    route.params?.customerId || (route.params?.customer as any)?.id;

  const { data: fetchedCustomer } = useQuery({
    queryKey: ["party", customerId],
    queryFn: () => partiesService.getPartyById(customerId!),
    enabled: !!customerId && !route.params?.customer,
  });

  const customerData = route.params?.customer || fetchedCustomer;

  const customer: CustomerProfile = customerData
    ? {
        id: customerData.id,
        name: customerData.name ?? "Unknown",
        businessType:
          customerData.party_type === "vendor"
            ? "Supplier"
            : customerData.businessType || "Customer",
        location: customerData.address || customerData.location || "—",
        phone: customerData.phone || customerData.mobile || "—",
        dueAmount:
          customerData.balance ||
          (route.params?.customer as any)?.dueAmount ||
          0,
        totalSale: (route.params?.customer as any)?.totalSale || 0,
        lastInvoice: (route.params?.customer as any)?.lastInvoice || "—",
      }
    : EMPTY_CUSTOMER;

  const { data: summary, isLoading: summaryLoading } =
    useCustomerFinancialSummary(customerId);

  const { deleteClient } = useClientMutations();

  const jumpToInvoices = React.useCallback(() => {
    (navigation.getParent() as any)?.navigate?.("InvoicesTab");
  }, [navigation]);

  const handleRecordPayment = React.useCallback(() => {
    if (!customerId) return;
    (navigation as any).navigate("CreditBook", {
      screen: "PartyLedgerScreen",
      params: { partyId: customerId, partyName: customer.name },
    });
  }, [navigation, customerId, customer.name]);

  const handleEdit = React.useCallback(() => {
    if (customerId) {
      navigation.navigate("CustomerForm", { customerId });
    }
  }, [navigation, customerId]);

  const handleDelete = React.useCallback(() => {
    Alert.alert("Delete Party", "Are you sure you want to delete this party?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (customerId) {
            await deleteClient.mutateAsync(customerId);
            navigation.goBack();
          }
        },
      },
    ]);
  }, [deleteClient, customerId, navigation]);

  return (
    <View style={styles.screen}>
      <DetailHeader
        title="Party Overview"
        actions={[
          {
            icon: <Share2 size={18} color={tokens.foreground} />,
            onPress: () => {
              Share.share({
                message: `Customer Details:\nName: ${customer.name}\nPhone: ${customer.phone}\nDue: ₹${summary?.outstanding || customer.dueAmount}`,
              });
            },
            accessibilityLabel: "Share party",
          },
          {
            icon: <Edit2 size={18} color={tokens.foreground} />,
            onPress: handleEdit,
            accessibilityLabel: "Edit",
          },
          {
            icon: <Trash2 size={18} color={tokens.destructive} />,
            onPress: handleDelete,
            accessibilityLabel: "Delete",
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerMeta}>
              {customer.businessType} · {customer.location}
            </Text>
            <Text style={styles.statusTag}>Receivable</Text>
          </View>
          <View style={styles.heroAmountBlock}>
            <Text style={styles.heroLabel}>Total Due</Text>
            <Text style={styles.heroAmount}>
              {formatCurrency(summary?.outstanding ?? customer.dueAmount)}
            </Text>
            <Text style={styles.heroHint}>Expected in 3 days</Text>
          </View>
        </View>

        <View style={styles.ctaRow}>
          <Pressable style={styles.primaryCta} onPress={handleRecordPayment}>
            <Text style={styles.primaryCtaText}>Record Payment</Text>
          </Pressable>
          <Pressable style={styles.secondaryCta} onPress={jumpToInvoices}>
            <Text style={styles.secondaryCtaText}>View Invoices</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Lifetime Sale</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary?.totalBilled ?? customer.totalSale)}
            </Text>
            <Text style={styles.summaryHint}>
              {summaryLoading
                ? "Loading invoices…"
                : `${summary?.orderCount ?? 0} invoices`}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Last Invoice</Text>
            <Text style={styles.summaryValue}>
              {summary?.lastOrderDate ?? customer.lastInvoice}
            </Text>
            <Text style={styles.summaryHint}>Most recent activity</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.sectionActions}>
              <Pressable style={styles.iconButtonSmall}>
                <Phone color={tokens.foreground} size={16} />
              </Pressable>
              <Pressable
                style={[styles.iconButtonSmall, styles.iconButtonSmallSpacer]}
              >
                <MessageCircle color={tokens.foreground} size={16} />
              </Pressable>
            </View>
          </View>
          <View style={styles.contactRow}>
            <DetailRow
              label="Primary Number"
              value={customer.phone}
              variant="card"
              style={styles.contactBlock}
            />
            <DetailRow
              label="WhatsApp"
              value="Same as phone"
              variant="card"
              style={styles.contactBlock}
            />
          </View>
          <View style={styles.contactRow}>
            <DetailRow
              label="Address"
              value={
                <View style={styles.addressRow}>
                  <MapPin color={tokens.primary} size={16} />
                  <Text style={[styles.contactValue, styles.addressText]}>
                    {customer.location}
                  </Text>
                </View>
              }
              variant="card"
              style={styles.contactBlockFull}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statements & Activity</Text>
            <ReceiptText color={tokens.primary} size={18} />
          </View>
          {ACTIVITY_LOG.map((item) => (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineLabel}>{item.label}</Text>
                <Text style={styles.timelineMeta}>{item.meta}</Text>
              </View>
              <Text style={styles.timelineAmount}>{item.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CreditBook</Text>
            <Text style={styles.sectionHint}>
              ₹12,850 outstanding · next due in 3 days
            </Text>
          </View>
          {CREDIT_ENTRIES.map((entry) => {
            const isOverdue = entry.status === "overdue";
            return (
              <View key={entry.id} style={styles.creditRow}>
                <View>
                  <Text style={styles.creditInvoice}>{entry.invoice}</Text>
                  <Text style={styles.creditMeta}>{entry.dueDate}</Text>
                </View>
                <View style={styles.creditActions}>
                  <Text
                    style={[
                      styles.creditAmount,
                      isOverdue ? styles.destructiveText : styles.accentText,
                    ]}
                  >
                    {formatCurrency(entry.amount)}
                  </Text>
                  <Pressable onPress={handleRecordPayment}>
                    <Text style={styles.creditActionLink}>Collect</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <Pressable onPress={jumpToInvoices}>
              <Text style={styles.sectionLink}>View all</Text>
            </Pressable>
          </View>
          {RECENT_INVOICES.map((invoice) => (
            <Pressable
              key={invoice.id}
              style={styles.invoiceRow}
              onPress={jumpToInvoices}
            >
              <View>
                <Text style={styles.invoiceLabel}>{invoice.invoice}</Text>
                <Text style={styles.invoiceMeta}>{invoice.issuedOn}</Text>
              </View>
              <View>
                <Text style={styles.invoiceAmount}>
                  {formatCurrency(invoice.total)}
                </Text>
                <Text style={styles.invoiceStatus}>{invoice.status}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Button
          label="Send Credit Reminder"
          fullWidth
          onPress={handleRecordPayment}
          style={styles.reminderButton}
        />
      </ScrollView>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    content: {
      padding: 20,
      paddingBottom: 32,
    },
    heroCard: {
      flexDirection: "row",
      borderRadius: 22,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: 18,
      marginBottom: 16,
    },
    ctaRow: {
      flexDirection: "row",
      marginBottom: 16,
    },
    primaryCta: {
      flex: 1,
      marginRight: 10,
      borderRadius: 14,
      backgroundColor: tokens.primary,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryCtaText: {
      color: tokens.primaryForeground,
      fontWeight: "700",
    },
    secondaryCta: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: tokens.card,
    },
    secondaryCtaText: {
      color: tokens.foreground,
      fontWeight: "700",
    },
    heroCopy: {
      flex: 1,
    },
    customerName: {
      fontSize: 20,
      fontWeight: "700",
      color: tokens.foreground,
    },
    customerMeta: {
      color: tokens.mutedForeground,
      marginTop: 4,
    },
    statusTag: {
      marginTop: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 12,
      paddingVertical: 4,
      color: tokens.warning,
      fontWeight: "600",
      fontSize: 12,
      alignSelf: "flex-start",
    },
    heroAmountBlock: {
      width: 140,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.background,
      alignItems: "flex-start",
    },
    heroLabel: {
      color: tokens.mutedForeground,
      marginBottom: 6,
    },
    heroAmount: {
      fontSize: 22,
      fontWeight: "700",
      color: tokens.foreground,
    },
    heroHint: {
      color: tokens.mutedForeground,
      marginTop: 4,
      fontSize: 12,
    },
    summaryRow: {
      flexDirection: "row",
      marginHorizontal: -6,
      marginBottom: 16,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: 16,
      marginHorizontal: 6,
    },
    summaryLabel: {
      color: tokens.mutedForeground,
      marginBottom: 8,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: "700",
      color: tokens.foreground,
    },
    summaryHint: {
      marginTop: 4,
      color: tokens.mutedForeground,
    },
    sectionCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: 18,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: tokens.foreground,
    },
    sectionHint: {
      color: tokens.mutedForeground,
      fontSize: 12,
    },
    sectionLink: {
      color: tokens.primary,
      fontWeight: "600",
    },
    sectionActions: {
      flexDirection: "row",
    },
    iconButtonSmallSpacer: {
      marginLeft: 8,
    },
    iconButtonSmall: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.background,
    },
    contactRow: {
      flexDirection: "row",
      marginHorizontal: -6,
      marginBottom: 10,
    },
    contactBlock: {
      flex: 1,
      marginHorizontal: 6,
    },
    contactBlockFull: {
      flex: 1,
      marginHorizontal: 6,
    },
    contactLabel: {
      color: tokens.mutedForeground,
      marginBottom: 6,
      fontSize: 12,
    },
    contactValue: {
      color: tokens.foreground,
      fontWeight: "600",
    },
    addressRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    addressText: {
      marginLeft: 6,
    },
    timelineRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    timelineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: tokens.primary,
      marginRight: 10,
    },
    timelineCopy: {
      flex: 1,
    },
    timelineLabel: {
      fontWeight: "600",
      color: tokens.foreground,
    },
    timelineMeta: {
      color: tokens.mutedForeground,
      marginTop: 2,
      fontSize: 12,
    },
    timelineAmount: {
      color: tokens.foreground,
      fontWeight: "600",
    },
    creditRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    creditInvoice: {
      fontWeight: "700",
      color: tokens.foreground,
    },
    creditMeta: {
      color: tokens.mutedForeground,
      marginTop: 4,
    },
    creditActions: {
      alignItems: "flex-end",
    },
    creditAmount: {
      fontWeight: "700",
    },
    creditActionLink: {
      color: tokens.primary,
      fontWeight: "600",
      marginTop: 4,
    },
    destructiveText: {
      color: tokens.destructive,
    },
    accentText: {
      color: tokens.accent,
    },
    invoiceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    invoiceLabel: {
      color: tokens.foreground,
      fontWeight: "600",
    },
    invoiceMeta: {
      color: tokens.mutedForeground,
      marginTop: 4,
    },
    invoiceAmount: {
      textAlign: "right",
      color: tokens.foreground,
      fontWeight: "700",
    },
    invoiceStatus: {
      textAlign: "right",
      color: tokens.mutedForeground,
      fontSize: 12,
      marginTop: 4,
    },
    reminderButton: {
      marginTop: 8,
    },
  });

export default CustomerDetailScreen;
