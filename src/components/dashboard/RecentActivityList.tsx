import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import SearchBar from "../SearchBar";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  ShoppingBag,
} from "lucide-react-native";
import type { AppNavigationParamList } from "../../navigation/types";
import type { TxnFilters } from "../modals/TxnFilterSheet";

export type CashSummary = {
  id: string;
  title: string;
  total: number;
  balance: number;
  status: "paid" | "pending" | "overdue" | "draft" | "sent";
  reference: string;
  date: string;
};

interface RecentActivityListProps {
  activities: CashSummary[];
  onViewAll?: () => void;
  searchTerm?: string;
  onSearchChange?: (text: string) => void;
  onFilterPress?: () => void;
  txnFilters?: TxnFilters;
}

const formatCurrency = (v: number) =>
  `₹${Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getStatusVisual = (
  status: CashSummary["status"],
  tokens: ThemeTokens,
) => {
  switch (status) {
    case "paid":
      return {
        label: "PAID",
        color: tokens.primary,
        bg: tokens.primaryAlpha15,
      };
    case "overdue":
      return {
        label: "OVERDUE",
        color: tokens.destructive,
        bg: tokens.destructiveAlpha15,
      };
    case "draft":
      return {
        label: "DRAFT",
        color: tokens.mutedForeground,
        bg: tokens.muted,
      };
    case "sent":
      return {
        label: "SENT",
        color: tokens.warning,
        bg: tokens.warningAlpha15,
      };
    default:
      return {
        label: "PENDING",
        color: tokens.warning,
        bg: tokens.warningAlpha15,
      };
  }
};

const TransactionRow: React.FC<{
  entry: CashSummary;
  onPress: () => void;
  tokens: ThemeTokens;
  styles: ReturnType<typeof createStyles>;
}> = ({ entry, onPress, tokens, styles }) => {
  const sv = getStatusVisual(entry.status, tokens);
  const isPaid = entry.status === "paid";
  const isExpense = entry.reference?.startsWith("EXP");
  const amountPrefix = isPaid ? "+" : isExpense ? "-" : "";
  const amountColor = isPaid
    ? tokens.primary
    : isExpense
      ? tokens.destructive
      : tokens.foreground;

  const Icon = isPaid ? ArrowDownLeft : isExpense ? ArrowUpRight : Receipt;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityLabel={`Transaction: ${entry.title}`}
    >
      <View style={styles.iconBox}>
        <Icon color={tokens.mutedForeground} size={16} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {entry.title}
        </Text>
        <Text style={styles.rowMeta}>
          {entry.reference}
          {entry.date ? ` · ${entry.date}` : ""}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowAmount, { color: amountColor }]}>
          {amountPrefix}
          {formatCurrency(entry.total)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: sv.bg }]}>
          <Text style={[styles.statusBadgeText, { color: sv.color }]}>
            {sv.label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  onViewAll,
  searchTerm = "",
  onSearchChange,
  onFilterPress,
  txnFilters,
}) => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();

  const filterActive = !!(
    txnFilters &&
    (txnFilters.status !== "all" || txnFilters.type !== "all")
  );

  const filtered = activities.filter((e) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (
        !e.title.toLowerCase().includes(q) &&
        !e.reference.toLowerCase().includes(q)
      )
        return false;
    }
    if (txnFilters) {
      if (txnFilters.status !== "all" && e.status !== txnFilters.status)
        return false;
      if (txnFilters.type !== "all") {
        const isPurchase = e.reference?.startsWith("EXP");
        if (txnFilters.type === "sale" && isPurchase) return false;
        if (txnFilters.type === "purchase" && !isPurchase) return false;
      }
    }
    return true;
  });

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
        <Pressable
          onPress={onViewAll ?? (() => navigation.navigate("InvoicesTab"))}
        >
          <Text style={styles.sectionLink}>View All</Text>
        </Pressable>
      </View>

      {onSearchChange && (
        <View style={styles.searchRow}>
          <SearchBar
            value={searchTerm}
            onChangeText={onSearchChange}
            placeholder="Search transactions…"
            showFilter={!!onFilterPress}
            onFilterPress={onFilterPress}
            filterActive={filterActive}
            style={styles.searchBarOverride}
          />
        </View>
      )}

      <View style={styles.list}>
        {filtered.length > 0 ? (
          filtered.map((entry, index) => (
            <View key={entry.id}>
              {index > 0 && <View style={styles.rowDivider} />}
              <TransactionRow
                entry={entry}
                tokens={tokens}
                styles={styles}
                onPress={() =>
                  navigation.navigate("InvoicesTab", {
                    screen: "InvoiceDetail",
                    params: {
                      invoiceId: entry.id,
                      invoice: {
                        id: entry.id,
                        invoiceNumber: entry.reference,
                        clientName: entry.title,
                        date: entry.date,
                        amount: entry.total,
                        status: entry.status,
                      },
                    },
                  })
                }
              />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <ShoppingBag size={36} color={tokens.mutedForeground} />
            <Text style={styles.emptyStateText}>
              {searchTerm.trim()
                ? `No transactions match "${searchTerm}"`
                : filterActive
                  ? "No transactions match current filters"
                  : "Start creating invoices to see activity"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    section: {
      backgroundColor: tokens.surface_container_lowest,
      marginBottom: tokens.spacingXs, // 4px
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: tokens.spacingLg, // 16px
      paddingVertical: tokens.spacingSm, // 8px
      backgroundColor: tokens.muted,
    },
    sectionTitle: {
      fontSize: 10, // Increased for better legibility
      fontWeight: "800",
      letterSpacing: 0.6,
      color: tokens.mutedForeground,
      textTransform: "uppercase",
    },
    sectionLink: {
      fontSize: 11, // Increased for better legibility
      fontWeight: "700",
      color: tokens.primary,
    },
    searchRow: {
      paddingHorizontal: tokens.spacingLg, // 16px
      paddingTop: tokens.spacingSm, // 8px — matches list column header top
      paddingBottom: tokens.spacingSm, // 8px — symmetric, creates consistent gap before first row
      backgroundColor: tokens.surface_container_lowest,
    },
    searchBarOverride: {
      marginBottom: 0,
    },
    list: {
      backgroundColor: tokens.surface_container_lowest,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: tokens.spacingLg, // 16px
      paddingVertical: tokens.spacingSm, // 8px
      gap: tokens.spacingSm, // 8px
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.border,
      marginLeft: tokens.spacingLg + 32 + tokens.spacingSm, // align with text, skip icon
      opacity: 0.6,
    },
    rowPressed: {
      backgroundColor: tokens.muted,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: tokens.radiusSm, // 8px
      backgroundColor: tokens.muted,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    rowInfo: {
      flex: 1,
      gap: tokens.spacingXs, // 4px
    },
    rowTitle: {
      fontSize: 13, // Increased for better legibility
      fontWeight: "600", // Semi-bold
      color: tokens.foreground,
    },
    rowMeta: {
      fontSize: 11, // Increased for better legibility
      color: tokens.mutedForeground,
    },
    rowRight: {
      alignItems: "flex-end",
      gap: tokens.spacingXs, // 4px
      flexShrink: 0,
    },
    rowAmount: {
      fontSize: 13, // Increased for better legibility
      fontWeight: "700", // Bold for emphasis
    },
    statusBadge: {
      paddingHorizontal: 6, // Slightly larger for better touch
      paddingVertical: 2,
      borderRadius: tokens.radiusXs, // 4px
    },
    statusBadgeText: {
      fontSize: 9, // Increased for better legibility
      fontWeight: "700", // Semi-bold
      letterSpacing: 0.3,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: tokens.spacingXxl + tokens.spacingSm, // 40px
      gap: tokens.spacingSm, // 8px
    },
    emptyStateText: {
      fontSize: 14, // Primary size
      fontWeight: "600", // Semi-bold
      color: tokens.mutedForeground,
      textAlign: "center",
      lineHeight: 20,
    },
  });

export default RecentActivityList;
