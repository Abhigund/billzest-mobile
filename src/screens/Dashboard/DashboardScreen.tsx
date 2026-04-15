import React, { useMemo, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { useOrganization } from "../../contexts/OrganizationContext";
import { useDashboardKpis } from "../../logic/dashboardLogic";
import { useOrders } from "../../logic/orderLogic";
import AddExpenseSheet from "../../components/modals/AddExpenseSheet";
import TxnFilterSheet, { TxnFilters } from "../../components/modals/TxnFilterSheet";
import ListHeader from "../../components/layout/ListHeader";
import {
  UserPlus,
  Scan,
  Wallet,
  AlertTriangle,
  Plus,
} from "lucide-react-native";
import EmptyState from "../../components/EmptyState";
import { useAppSettingsStore } from "../../stores/appSettingsStore";
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";
import RecentActivityList, {
  CashSummary,
} from "../../components/dashboard/RecentActivityList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase/supabaseClient";
import type { AppNavigationParamList } from "../../navigation/types";
import { useScreenContentPadding } from "../../components/layout/ScreenContent";

const formatCompact = (value: number): string => {
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}k`;
  return `₹${value.toLocaleString("en-IN")}`;
};

const WEEKLY_BARS = [0.65, 0.42, 0.78, 0.91, 0.58, 0.33, 0.47]; // More realistic weekly pattern
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DashboardScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const contentContainerStyle = useScreenContentPadding({
    top: "none",
    bottom: 100,
    horizontal: 0,
  });
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const [expenseSheetVisible, setExpenseSheetVisible] = useState(false);
  const [dateRange, setDateRange] = useState<"Today" | "Week" | "Month" | "Year">("Month");
  const [refreshing, setRefreshing] = useState(false);
  const [txnSearch, setTxnSearch] = useState("");
  const [txnFilters, setTxnFilters] = useState<TxnFilters>({ payment_status: 'all', type: 'all' });
  const [txnFilterSheetVisible, setTxnFilterSheetVisible] = useState(false);

  const {
    data: kpis,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useDashboardKpis(dateRange);
  const { organization } = useOrganization();
  const { simplifiedPOSEnabled } = useAppSettingsStore();
  const { data: invoices = [], refetch: refetchInvoices } = useOrders();

  const { data: creditSummary } = useQuery({
    queryKey: ["creditSummary", "dashboard", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { receivables: 0, payables: 0 };
      const [ordersResult, partiesResult] = await Promise.all([
        supabase
          .from("orders")
          .select("party_id, total_amount, received_amount, payment_status, is_cancelled")
          .eq("organization_id", organization.id)
          .eq("is_cancelled", false),
        supabase
          .from("parties")
          .select("id, type")
          .eq("organization_id", organization.id)
          .is("deleted_at", null),
      ]);
      const orders = ordersResult.data ?? [];
      const parties = partiesResult.data ?? [];
      const partyTypeMap = new Map<string, string>();
      parties.forEach((p) => partyTypeMap.set(p.id, p.type));
      const balanceByParty = new Map<string, number>();
      orders.forEach((ord) => {
        const outstanding = Math.max(0, (ord.total_amount ?? 0) - (ord.received_amount ?? 0));
        balanceByParty.set(ord.party_id, (balanceByParty.get(ord.party_id) ?? 0) + outstanding);
      });
      let receivables = 0;
      let payables = 0;
      balanceByParty.forEach((bal, pid) => {
        const t = partyTypeMap.get(pid)?.toUpperCase();
        if (t === "CUSTOMER" || t === "CLIENT") receivables += bal;
        else if (t === "VENDOR") payables += bal;
      });
      return { receivables, payables };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 30,
  });

  const overdueCount = useMemo(
    () => invoices.filter((inv) => inv.payment_status?.toLowerCase() === "overdue").length,
    [invoices],
  );
  const overdueAmount = useMemo(
    () => invoices
      .filter((inv) => inv.payment_status?.toLowerCase() === "overdue")
      .reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0),
    [invoices],
  );

  const recentActivities = useMemo<CashSummary[]>(() => {
    const getTs = (d: string | null | undefined) => {
      if (!d) return 0;
      const dt = d.includes("T") ? new Date(d) : new Date(d + "T00:00:00");
      return isNaN(dt.getTime()) ? 0 : dt.getTime();
    };
    const fmt = (d: string | null | undefined) => {
      if (!d) return "";
      const dt = d.includes("T") ? new Date(d) : new Date(d + "T00:00:00");
      if (isNaN(dt.getTime())) return "";
      return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    };
    return invoices
      .filter((inv) => !inv.is_cancelled)
      .sort((a, b) => getTs(b.created_at) - getTs(a.created_at))
      .slice(0, 7)
      .map((inv) => {
        const received = (inv as any).received_amount ?? 0;
        const balance = Math.max(0, (inv.total_amount ?? 0) - received);
        const s = inv.payment_status?.toLowerCase() ?? "pending";
        return {
          id: inv.id,
          title: (inv as any).party?.name || "Cash Sale",
          total: inv.total_amount ?? 0,
          balance,
          status: (s === "paid" ? "paid" : s) as any,
          reference: `INV-${inv.invoice_number}`,
          date: fmt(inv.created_at),
        };
      });
  }, [invoices]);

  const handleQuickAction = useCallback(
    (id: string) => {
      switch (id) {
        case "invoice":
          simplifiedPOSEnabled
            ? navigation.navigate("SimplifiedPOS")
            : navigation.navigate("InvoicesTab", { screen: "AddSale" });
          break;
        case "party":
          navigation.navigate("CustomersTab", { screen: "CustomersMain" });
          break;
        case "pay":
          setExpenseSheetVisible(true);
          break;
        case "stock":
          navigation.navigate("ProductsTab", { screen: "ProductsMain", params: { openScanner: false } });
          break;
      }
    },
    [navigation, simplifiedPOSEnabled],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchInvoices()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchInvoices]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.screen}>
        <ListHeader title="Dashboard" />
        <ScrollView style={styles.container} contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
          <DashboardSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.screen}>
        <ListHeader title="Dashboard" />
        <ScrollView style={styles.container} contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
          <EmptyState
            icon={<AlertTriangle color={tokens.destructive} size={48} />}
            title="Unable to load dashboard"
            description="Check your connection and try again."
            actionLabel="Retry"
            onAction={refetch}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ListHeader title="Dashboard" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={tokens.primary}
          />
        }
      >
        {/* ── 3-Column Metrics ── */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCell, styles.metricBorderPrimary]}>
            <Text style={styles.metricLabel}>SALES</Text>
            <Text style={styles.metricValue}>{formatCompact(kpis?.todaySales ?? 0)}</Text>
          </View>
          <View style={[styles.metricCell, styles.metricBorderReceivable]}>
            <Text style={styles.metricLabel}>RECEIVABLE</Text>
            <Text style={styles.metricValue}>{formatCompact(creditSummary?.receivables ?? 0)}</Text>
          </View>
          <View style={[styles.metricCell, styles.metricBorderPayable]}>
            <Text style={styles.metricLabel}>PAYABLE</Text>
            <Text style={styles.metricValue}>{formatCompact(creditSummary?.payables ?? 0)}</Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickActionsRow}>
          <Pressable
            style={[styles.quickActionBtn, styles.quickActionBtnPrimary]}
            onPress={() => handleQuickAction("invoice")}
            accessibilityLabel="New Invoice"
          >
            <Plus color={tokens.primaryForeground} size={14} />
            <Text style={styles.quickActionTextPrimary}>INVOICE</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => handleQuickAction("party")}
            accessibilityLabel="Add Party"
          >
            <UserPlus color={tokens.foreground} size={14} />
            <Text style={styles.quickActionText}>PARTY</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => handleQuickAction("pay")}
            accessibilityLabel="Add Expense"
          >
            <Wallet color={tokens.foreground} size={14} />
            <Text style={styles.quickActionText}>PAY</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => handleQuickAction("stock")}
            accessibilityLabel="View Stock"
          >
            <Scan color={tokens.foreground} size={14} />
            <Text style={styles.quickActionText}>STOCK</Text>
          </Pressable>
        </View>

        {/* ── Alert Banners ── */}
        {overdueCount > 0 && (
          <Pressable
            style={styles.alertBannerWarning}
            onPress={() => navigation.navigate("InvoicesTab", { screen: "InvoicesMain" })}
            accessibilityLabel={`${overdueCount} overdue invoices`}
          >
            <View style={styles.alertBannerLeft}>
              <AlertTriangle color={tokens.destructive} size={14} />
              <Text style={styles.alertBannerTextWarning}>
                {overdueCount} Overdue Invoice{overdueCount > 1 ? "s" : ""} ({formatCompact(overdueAmount)})
              </Text>
            </View>
            <Text style={styles.alertChevron}>›</Text>
          </Pressable>
        )}
        {/* ── Recent Transactions ── */}
        <RecentActivityList
          activities={recentActivities}
          searchTerm={txnSearch}
          onSearchChange={setTxnSearch}
          onFilterPress={() => setTxnFilterSheetVisible(true)}
          txnFilters={txnFilters}
          onViewAll={() => navigation.navigate("InvoicesTab", { screen: "InvoicesMain" })}
        />

        {/* ── Weekly Run Rate ── */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>WEEKLY RUN RATE</Text>
            <Text style={styles.chartBadge}>+12.4%</Text>
          </View>
          <View style={styles.barsRow}>
            {WEEKLY_BARS.map((ratio, i) => (
              <View key={i} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, ratio * 48),
                      backgroundColor: i === 4 ? tokens.primary : `rgba(0,110,45,${0.15 + ratio * 0.45})`,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.barLabelsRow}>
            {WEEK_DAYS.map((day, i) => (
              <Text key={i} style={[styles.barDayLabel, i === 4 && styles.barDayLabelActive]}>{day}</Text>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />

        <AddExpenseSheet
          visible={expenseSheetVisible}
          onClose={() => setExpenseSheetVisible(false)}
        />
        <TxnFilterSheet
          visible={txnFilterSheetVisible}
          onClose={() => setTxnFilterSheetVisible(false)}
          onApply={setTxnFilters}
          initialFilters={txnFilters}
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
    container: {
      flex: 1,
    },
    metricsRow: {
      flexDirection: "row",
      gap: tokens.spacingXs, // 4px gap for tight spacing
      marginBottom: tokens.spacingSm, // 8px
      paddingHorizontal: tokens.spacingLg, // 16px
    },
    metricCell: {
      flex: 1,
      backgroundColor: tokens.surface_container_lowest,
      paddingVertical: tokens.spacingSm, // 8px
      paddingHorizontal: tokens.spacingSm, // 8px
      borderLeftWidth: 3,
    },
    metricBorderPrimary: {
      borderLeftColor: tokens.primary,
    },
    metricBorderReceivable: {
      borderLeftColor: "rgba(29,185,84,0.45)",
    },
    metricBorderPayable: {
      borderLeftColor: tokens.destructive,
    },
    metricLabel: {
      fontSize: 10, // Increased for better legibility
      fontWeight: "800",
      letterSpacing: 0.6,
      color: tokens.mutedForeground,
      textTransform: "uppercase",
      marginBottom: tokens.spacingXs, // 4px
    },
    metricValue: {
      fontSize: 16, // Increased for better legibility
      fontWeight: "800",
      color: tokens.foreground,
      letterSpacing: -0.3,
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: tokens.spacingSm, // 8px
      paddingVertical: tokens.spacingSm, // 8px
      paddingHorizontal: tokens.spacingLg, // 16px
    },
    quickActionBtn: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: tokens.spacingXs, // 4px
      backgroundColor: tokens.surface_container_low,
      paddingHorizontal: tokens.spacingXs, // 4px — same for all
      paddingVertical: tokens.spacingSm, // 8px — same for all
      borderRadius: tokens.radiusSm, // 8px
    },
    quickActionBtnPrimary: {
      flex: 1,
      minWidth: 0,
      backgroundColor: tokens.primary,
    },
    quickActionText: {
      fontSize: 11,
      fontWeight: "700",
      color: tokens.foreground, // Better contrast
      letterSpacing: 0.3,
    },
    quickActionTextPrimary: {
      fontSize: 11,
      fontWeight: "700",
      color: tokens.primaryForeground,
      letterSpacing: 0.3,
    },
    alertBannerWarning: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: tokens.destructiveAlpha10, // Use token
      borderLeftWidth: 3,
      borderLeftColor: tokens.destructive,
      paddingHorizontal: tokens.spacingLg, // 16px
      paddingVertical: tokens.spacingSm, // 8px
      marginBottom: tokens.spacingXs, // 4px
    },
    alertBannerSuccess: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: tokens.primaryAlpha10, // Use token
      borderLeftWidth: 3,
      borderLeftColor: tokens.primary,
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: tokens.spacingSm, // 8px
      marginBottom: tokens.spacingSm, // 8px
    },
    alertBannerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: tokens.spacingSm, // 8px
    },
    alertBannerTextWarning: {
      fontSize: 11,
      fontWeight: "700",
      color: tokens.destructive,
    },
    alertBannerTextSuccess: {
      fontSize: 11,
      fontWeight: "700",
      color: tokens.primary,
    },
    alertChevron: {
      fontSize: 16,
      color: tokens.destructive,
      fontWeight: "700",
    },
    chartSection: {
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: tokens.radiusMd, // 12px
      padding: tokens.spacingMd, // 12px
      marginTop: tokens.spacingSm, // 8px
      marginHorizontal: tokens.spacingLg, // 16px
      borderLeftWidth: 3,
      borderLeftColor: "rgba(29,185,84,0.45)",
    },
    chartHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: tokens.spacingSm, // 8px
    },
    chartTitle: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.6,
      color: tokens.foreground,
      textTransform: "uppercase",
    },
    chartBadge: {
      fontSize: 12,
      fontWeight: "700",
      color: tokens.primary,
    },
    barsRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: tokens.spacingXs, // 4px
      height: 52,
    },
    barWrapper: {
      flex: 1,
      height: 52,
      justifyContent: "flex-end",
    },
    bar: {
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
    barLabelsRow: {
      flexDirection: "row",
      gap: tokens.spacingXs,
      marginTop: 4,
    },
    barDayLabel: {
      flex: 1,
      fontSize: 9,
      fontWeight: "600",
      color: tokens.mutedForeground,
      textAlign: "center",
      letterSpacing: 0.3,
    },
    barDayLabelActive: {
      color: tokens.primary,
      fontWeight: "800",
    },
  });

export default DashboardScreen;
