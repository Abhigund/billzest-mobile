import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
  Animated,
} from "react-native";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import QuickLinksCard from "../../components/QuickLinksCard";
import { useSupabase } from "../../contexts/SupabaseContext";
import { useOrganization } from "../../contexts/OrganizationContext";
import { useDashboardKpis } from "../../logic/dashboardLogic";
import { useOrders } from "../../logic/orderLogic";
import AddExpenseSheet from "../../components/modals/AddExpenseSheet";
import {
  ShoppingCart,
  UserPlus,
  Scan,
  Wallet,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Zap,
} from "lucide-react-native";
import EmptyState from "../../components/EmptyState";
import { useAppSettingsStore } from "../../stores/appSettingsStore";
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";

// Components
import TodaysSalesHero from "../../components/dashboard/TodaysSalesHero";
import CreditSummaryCards from "../../components/dashboard/CreditSummaryCards";
import BusinessInsightsCards from "../../components/dashboard/BusinessInsightsCards";
import PurchaseReportCard from "../../components/dashboard/PurchaseReportCard";
import RecentActivityList, {
  CashSummary,
} from "../../components/dashboard/RecentActivityList";
import type { AppNavigationParamList } from "../../navigation/types";
import { useScreenContentPadding } from "../../components/layout/ScreenContent";

const DashboardScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const contentContainerStyle = useScreenContentPadding({
    top: "compact",
    bottom: 100,
  });
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const { user } = useSupabase();

  // State
  const [expenseSheetVisible, setExpenseSheetVisible] = useState(false);
  const [dateRange, setDateRange] = useState<
    "Today" | "Week" | "Month" | "Year"
  >("Today");
  const [refreshing, setRefreshing] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));

  // Logic
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

  // Transform recent orders to CashSummary format
  const recentActivities = useMemo<CashSummary[]>(() => {
    if (!invoices || invoices.length === 0) {
      return [];
    }

    // Helper function to safely parse and format dates
    const formatDate = (dateString: string | null | undefined): string => {
      if (!dateString) {
        return new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });
      }

      // Handle date strings in YYYY-MM-DD format
      const date = dateString.includes("T")
        ? new Date(dateString)
        : new Date(dateString + "T00:00:00");

      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Fallback: try parsing as-is
        const fallbackDate = new Date(dateString);
        if (isNaN(fallbackDate.getTime())) {
          return new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
          });
        }
        return fallbackDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });
      }

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });
    };

    // Helper function to safely get date timestamp for sorting
    const getDateTimestamp = (
      dateString: string | null | undefined,
    ): number => {
      if (!dateString) return 0;

      const date = dateString.includes("T")
        ? new Date(dateString)
        : new Date(dateString + "T00:00:00");

      if (isNaN(date.getTime())) {
        const fallbackDate = new Date(dateString);
        return isNaN(fallbackDate.getTime()) ? 0 : fallbackDate.getTime();
      }

      return date.getTime();
    };

    // Filter out cancelled invoices and sort by created_at descending (most recent first) and take top 5
    return invoices
      .filter((inv) => inv.status !== "cancelled") // Exclude cancelled invoices
      .sort((a, b) => {
        const dateA = getDateTimestamp(a.created_at);
        const dateB = getDateTimestamp(b.created_at);
        return dateB - dateA; // Descending order
      })
      .slice(0, 5) // Get top 5 recent invoices
      .map((inv) => {
        // V2: Use received_amount directly from orders
        const received = (inv as any).received_amount ?? 0;
        const balance = Math.max(0, (inv.total_amount ?? 0) - received);

        // Map invoice status to CashSummary status format
        // Use the actual invoice status from database, not calculated from balance
        const invoiceStatus = inv.status?.toLowerCase() || "pending";
        let cashSummaryStatus: "paid" | "pending";

        if (invoiceStatus === "paid" || invoiceStatus === "cancelled") {
          cashSummaryStatus = "paid";
        } else {
          // For 'draft', 'sent', 'overdue', or any other status, show as pending
          cashSummaryStatus = "pending";
        }

        return {
          id: inv.id,
          title: inv.party?.name || "Cash Sale",
          total: inv.total_amount ?? 0,
          balance,
          status: cashSummaryStatus,
          reference: `#${inv.invoice_number}`,
          date: formatDate(inv.created_at),
        };
      });
  }, [invoices]);

  const todayDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(new Date());
  }, []);

  const storeName = useMemo(() => {
    // Priority: organization table > current user profile > fallback
    return (
      organization?.name ||
      user?.user_metadata?.business_name ||
      user?.user_metadata?.name ||
      "My Shop"
    );
  }, [organization, user]);

  const handleQuickLinkPress = useCallback(
    (id: string) => {
      switch (id) {
        case "add-sale":
          if (simplifiedPOSEnabled) {
            navigation.navigate("SimplifiedPOS");
          } else {
            navigation.navigate("InvoicesTab", { screen: "AddSale" });
          }
          break;
        case "add-expense":
          setExpenseSheetVisible(true);
          break;
        case "add-party":
          navigation.navigate("CustomersTab", { screen: "CustomersMain" });
          break;
        case "scan-item":
          // Navigate to products list with scanner open
          navigation.navigate("ProductsTab", {
            screen: "ProductsMain",
            params: { openScanner: true },
          });
          break;
        default:
          break;
      }
    },
    [navigation],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchInvoices()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchInvoices]);

  // Animate refresh icon
  useEffect(() => {
    if (refreshing || isRefetching) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [refreshing, isRefetching]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Check if we have any data at all
  const hasNoData =
    !isLoading &&
    !error &&
    kpis &&
    kpis.todaySales === 0 &&
    kpis.totalSales === 0 &&
    kpis.totalPurchases === 0 &&
    kpis.inventoryValue === 0 &&
    kpis.totalExpenses === 0 &&
    invoices.length === 0;

  if (isLoading && !refreshing) {
    return (
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        >
          <DashboardSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        >
          <EmptyState
            icon={<AlertTriangle color={tokens.destructive} size={48} />}
            title="Unable to load dashboard"
            description="We couldn't fetch your dashboard data. Please check your connection and try again."
            actionLabel="Retry"
            onAction={() => {
              refetch();
            }}
          />
        </ScrollView>
      </View>
    );
  }

  if (hasNoData) {
    return (
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tokens.primary}
            />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.storeName}>Welcome, {storeName}</Text>
              <Text style={styles.dateLabel}>{todayDate}</Text>
            </View>
          </View>
          <EmptyState
            icon={<ShoppingCart color={tokens.mutedForeground} size={48} />}
            title="No data yet"
            description="Start by creating your first sale, adding products, or recording expenses to see your dashboard metrics."
            actionLabel="Create Sale"
            onAction={() => handleQuickLinkPress("add-sale")}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.storeName}>Welcome, {storeName}</Text>
              <Text style={styles.dateLabel}>{todayDate}</Text>
            </View>
            <Pressable
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={refreshing || isRefetching}
            >
              <Animated.View
                style={{
                  transform: [{ rotate: rotateInterpolate }],
                }}
              >
                <RefreshCw size={20} color={tokens.primary} />
              </Animated.View>
            </Pressable>
          </View>

          {/* Date Range Filter */}
          <View style={styles.dateRangeContainer}>
            {(["Today", "Week", "Month", "Year"] as const).map((range) => (
              <Pressable
                key={range}
                style={[
                  styles.dateRangePill,
                  dateRange === range && styles.dateRangePillActive,
                ]}
                onPress={() => setDateRange(range)}
              >
                <Text
                  style={[
                    styles.dateRangeText,
                    dateRange === range && styles.dateRangeTextActive,
                  ]}
                >
                  {range}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Today's Sales - Hero */}
        <TodaysSalesHero
          sales={kpis?.todaySales ?? 0}
          isLoading={isLoading && !refreshing}
        />

        {/* Credit Book Hero */}
        <CreditSummaryCards />

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickLinksCard
          items={[
            {
              id: "add-sale",
              label: "New Sale",
              icon: <ShoppingCart color={tokens.primary} size={24} />,
              onPress: () => handleQuickLinkPress("add-sale"),
            },
            {
              id: "add-expense",
              label: "Add Expense",
              icon: <Wallet color={tokens.primary} size={24} />,
              onPress: () => handleQuickLinkPress("add-expense"),
            },
            {
              id: "add-party",
              label: "Add Party",
              icon: <UserPlus color={tokens.primary} size={24} />,
              onPress: () => handleQuickLinkPress("add-party"),
            },
            {
              id: "scan-item",
              label: "Scan Item",
              icon: <Scan color={tokens.primary} size={24} />,
              onPress: () => handleQuickLinkPress("scan-item"),
            },
          ]}
        />

        {/* Recent Activity */}
        <RecentActivityList activities={recentActivities} />

        {/* Expandable Insights */}
        <Pressable
          style={styles.expandableSectionHeader}
          onPress={() => setInsightsExpanded(prev => !prev)}
          accessibilityLabel="Toggle business insights section"
        >
          <Text style={styles.sectionTitle}>
            {insightsExpanded ? "Hide Insights" : "Show Insights"}
          </Text>
        </Pressable>
        {insightsExpanded ? (
          <>
            <BusinessInsightsCards
              inventoryValue={kpis?.inventoryValue ?? 0}
              totalExpenses={kpis?.totalExpenses ?? 0}
              isLoading={isLoading && !refreshing}
            />
            <View style={styles.purchaseReportContainer}>
              <PurchaseReportCard
                totalPurchases={kpis?.totalPurchases ?? 0}
                isLoading={isLoading && !refreshing}
              />
            </View>
          </>
        ) : null}

        <View style={styles.footerSpacer} />

        <AddExpenseSheet
          visible={expenseSheetVisible}
          onClose={() => setExpenseSheetVisible(false)}
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
    centerContent: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      color: tokens.mutedForeground,
      fontSize: 16,
    },
    container: {
      flex: 1,
    },
    header: {
      marginBottom: 20,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    headerText: {
      flex: 1,
    },
    storeName: {
      fontSize: 24,
      fontWeight: "800",
      color: tokens.foreground,
    },
    dateLabel: {
      fontSize: 14,
      color: tokens.mutedForeground,
      marginTop: 4,
    },
    refreshButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: tokens.card,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    dateRangeContainer: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    dateRangePill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: tokens.card,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    dateRangePillActive: {
      backgroundColor: tokens.primary,
      borderColor: tokens.primary,
    },
    dateRangeText: {
      fontSize: 13,
      fontWeight: "600",
      color: tokens.mutedForeground,
    },
    dateRangeTextActive: {
      color: tokens.primaryForeground,
    },
    sectionTitle: {
      color: tokens.foreground,
      fontWeight: "700",
      fontSize: 18,
      marginTop: 24, // Added to space out sections
      marginBottom: 16,
    },
    expandableSectionHeader: {
      marginTop: 8,
    },
    footerSpacer: {
      height: 30,
    },
    purchaseReportContainer: {
      marginTop: 12,
    },
  });

export default DashboardScreen;
