import React, { useMemo, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import PartyCard, { PartyModel, PartyStatus } from "../../components/PartyCard";
import SearchBar from "../../components/SearchBar";
import EmptyState from "../../components/EmptyState";
import CustomerListSkeleton from "../../components/skeletons/CustomerListSkeleton";
import FAB from "../../components/ui/FAB";
import { Linking, Share, Alert } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useClients } from "../../logic/partyLogic";
import { Party } from "../../types/domain";
import { supabase } from "../../supabase/supabaseClient";
import { useOrganization } from "../../contexts/OrganizationContext";
import { CustomersStackParamList } from "../../navigation/types";
import PartyFilterSheet, {
  PartyFilters,
} from "../../components/modals/PartyFilterSheet";
import { MoreVertical, Plus, Users } from "lucide-react-native";
import { useScreenContentPadding } from "../../components/layout/ScreenContent";
import ListHeader from "../../components/layout/ListHeader";
import ScreenWrapper from "../../components/ScreenWrapper";

const formatMetricCurrency = (value: number): string =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

interface AugmentedParty extends Party {
  calculatedBalance: number;
  totalSale: number;
  lastInvoiceDate: Date | null;
}

const CustomersListScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const contentContainerStyle = useScreenContentPadding({
    horizontal: 16,
    top: 8,
    bottom: tabBarHeight + 40,
  });
  const navigation =
    useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<PartyFilters>({
    balanceType: "all",
    groups: ["general"],
  });
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const { organizationId } = useOrganization();

  const {
    data: parties = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useClients();

  // Calculate outstanding balances from orders
  const { data: partiesWithBalances = [] } = useQuery<AugmentedParty[]>({
    queryKey: ["parties", organizationId, "with-outstanding-balances"],
    queryFn: async () => {
      if (!organizationId || parties.length === 0)
        return parties as AugmentedParty[];

      const { data: orders } = await supabase
        .from("orders")
        .select(
          "id, party_id, total_amount, received_amount, status, is_cancelled, created_at",
        )
        .eq("organization_id", organizationId)
        .eq("is_cancelled", false);

      const orderRows = orders ?? [];

      const balanceByParty = new Map<
        string,
        { outstanding: number; totalSale: number; lastOrder: Date | null }
      >();
      orderRows.forEach((ord) => {
        if (ord.status === "cancelled") return;
        const total = ord.total_amount ?? 0;
        const received = (ord as any).received_amount ?? 0;
        const outstanding = total - received; // Can be negative (advance)
        const lastOrder = ord.created_at ? new Date(ord.created_at) : null;

        const existing = balanceByParty.get(ord.party_id);
        balanceByParty.set(ord.party_id, {
          outstanding: (existing?.outstanding ?? 0) + outstanding,
          totalSale: (existing?.totalSale ?? 0) + total,
          lastOrder:
            existing?.lastOrder && lastOrder
              ? existing.lastOrder > lastOrder
                ? existing.lastOrder
                : lastOrder
              : lastOrder || existing?.lastOrder || null,
        });
      });

      return parties.map((party) => {
        const balanceData = balanceByParty.get(party.id);
        return {
          ...party,
          calculatedBalance: balanceData?.outstanding ?? 0,
          totalSale: balanceData?.totalSale ?? 0,
          lastInvoiceDate: balanceData?.lastOrder ?? null,
        } as AugmentedParty;
      });
    },
    enabled: parties.length > 0 && !!organizationId,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const normalizedParties: PartyModel[] = useMemo(() => {
    return partiesWithBalances.map((party) => {
      const balance = party.calculatedBalance ?? party.balance ?? 0;
      let status: PartyStatus = "SETTLED";
      if (balance > 0) status = "RECEIVABLE";
      if (balance < 0) status = "PAYABLE";

      // Additional logic for OVERDUE could go here if we had due dates

      return {
        id: party.id,
        name: party.name ?? "Untitled Party",
        phone: party.phone || party.mobile || "—",
        balance: balance,
        status: status,
        partyType: party.party_type === "vendor" ? "VENDOR" : "CUSTOMER",
      };
    });
  }, [partiesWithBalances]);

  const filteredParties = useMemo(() => {
    return normalizedParties.filter((party) => {
      const matchesSearch = party.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesBalanceType = (() => {
        if (filters.balanceType === "all") return true;
        if (filters.balanceType === "collect") return party.balance > 0;
        if (filters.balanceType === "pay") return party.balance < 0;
        if (filters.balanceType === "overdue")
          return party.status === "OVERDUE";
        return true;
      })();

      return matchesSearch && matchesBalanceType;
    });
  }, [searchTerm, filters, normalizedParties]);

  return (
    <ScreenWrapper>
      <View style={styles.screen}>
        <ListHeader title="Parties" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={contentContainerStyle}
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isRefetching}
            onRefresh={onRefresh}
            colors={[tokens.primary]}
            tintColor={tokens.primary}
          />
        }
      >
        <SearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search parties..."
          showFilter
          onFilterPress={() => setFilterSheetVisible(true)}
          trailingActions={
            <TouchableOpacity>
              <MoreVertical color={tokens.mutedForeground} size={20} />
            </TouchableOpacity>
          }
        />

        <View style={styles.listHeader}>
          <Text style={styles.listHeaderLabel}>PARTY DETAILS</Text>
          <Text style={styles.listHeaderLabel}>CURRENT BALANCE</Text>
        </View>

        <View style={styles.partyList}>
          {isLoading && <CustomerListSkeleton />}

          {error && !isLoading && (
            <EmptyState
              icon={<Users color={tokens.destructive} size={32} />}
              title="Unable to load parties"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={refetch}
            />
          )}

          {!isLoading && !error && filteredParties.length === 0 && (
            <EmptyState
              icon={<Users color={tokens.primary} size={32} />}
              title="No parties found"
              description="Try adjusting your search or filters."
              actionLabel="Add New Party"
              onAction={() => navigation.navigate("CustomerForm", {})}
            />
          )}
          {filteredParties.map((party, index) => (
            <PartyCard
              key={party.id}
              party={party}
              alternate={index % 2 !== 0}
              onPress={() =>
                navigation.navigate("CustomerDetail", { customerId: party.id })
              }
            />
          ))}
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <FAB
        label="Add New Party"
        icon={<Plus color="#fff" size={24} />}
        onPress={() => navigation.navigate("CustomerForm", {})}
        style={{ bottom: tabBarHeight + Math.max(insets.bottom, 8) + 12 }}
      />

      <PartyFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        initialFilters={filters}
        onApply={setFilters}
      />
      </View>
    </ScreenWrapper>
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
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: tokens.spacingSm, // 8px — normalized across all screens
      paddingHorizontal: tokens.spacingLg, // 16px
      backgroundColor: tokens.muted,
      marginHorizontal: -tokens.spacingLg, // bleed full-width against contentContainerStyle padding
      marginBottom: tokens.spacingSm, // 8px
    },
    listHeaderLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: tokens.mutedForeground,
      letterSpacing: 0.5,
    },
    partyList: {
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 16,
      overflow: "hidden",
    },
    footerSpacer: {
      height: 30,
    },
  });

export default CustomersListScreen;
