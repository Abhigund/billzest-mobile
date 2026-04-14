import React, { useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import PartyCard, { PartyModel, PartyStatus } from '../../components/PartyCard';
import FAB from '../../components/ui/FAB';
import { Linking } from 'react-native';
import { useSuppliers } from '../../logic/partyLogic';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Users, AlertTriangle, UserPlus, Menu, Search } from 'lucide-react-native';
import EmptyState from '../../components/EmptyState';
import SearchBar from '../../components/SearchBar';
import type { PurchaseStackParamList } from '../../navigation/types';

const formatMetricCurrency = (value: number): string =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const SuppliersListScreen = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation =
    useNavigation<NativeStackNavigationProp<PurchaseStackParamList>>();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: suppliers = [], isLoading, isRefetching, refetch, error } = useSuppliers();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const normalizedSuppliers: PartyModel[] = useMemo(() => {
    return suppliers.map(party => {
      const balance = party.balance ?? 0;
      let status: PartyStatus = 'SETTLED';
      if (balance > 0) status = 'RECEIVABLE'; // In context of vendor, positive usually means we owe them (payable), but logic depends on app-wide balance sign convention
      if (balance < 0) status = 'PAYABLE';
      
      return {
        id: party.id,
        name: party.name ?? 'Untitled Vendor',
        phone: party.phone || party.mobile || '—',
        balance: balance,
        status: balance < 0 ? 'PAYABLE' : (balance > 0 ? 'RECEIVABLE' : 'SETTLED'),
        partyType: 'VENDOR',
      };
    });
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    return normalizedSuppliers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [normalizedSuppliers, searchTerm]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon}>
              <Menu color={tokens.foreground} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vendors</Text>
          <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={tokens.primary}
          />
        }
      >
        <SearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search vendors..."
        />

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Vendors</Text>
            <Text style={styles.summaryValue}>{suppliers.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Payable</Text>
            <Text style={[styles.summaryValue, { color: tokens.destructive }]}>
              {formatMetricCurrency(
                suppliers.reduce((acc, curr) => acc + Math.abs(curr.balance ?? 0), 0)
              )}
            </Text>
          </View>
        </View>

        <View style={styles.listHeader}>
            <Text style={styles.listHeaderLabel}>VENDOR DETAILS</Text>
            <Text style={styles.listHeaderLabel}>CURRENT BALANCE</Text>
        </View>

        <View style={styles.listContainer}>
          {isLoading && !isRefetching && (
             <ActivityIndicator size="large" color={tokens.primary} style={{ marginTop: 20 }} />
          )}

          {!isLoading && error && (
            <EmptyState
              icon={<AlertTriangle color={tokens.destructive} size={32} />}
              title="Unable to load vendors"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={refetch}
            />
          )}

          {!isLoading && !error && filteredSuppliers.length === 0 && (
            <EmptyState
              icon={<UserPlus color={tokens.primary} size={32} />}
              title="No vendors found"
              description="Add your first vendor to track purchases."
              actionLabel="Add Vendor"
              onAction={() => navigation.navigate('PurchaseCreateVendor', {})}
            />
          )}

          {filteredSuppliers.map(supplier => (
            <PartyCard
              key={supplier.id}
              party={supplier}
              onPress={() => {
                // Future Implementation for Supplier Detail
              }}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        label="Add Vendor"
        onPress={() => navigation.navigate('PurchaseCreateVendor', {})}
        icon={<UserPlus color="#fff" size={24} />}
      />
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: tokens.background,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: tokens.foreground,
    },
    headerIcon: {
        padding: 8,
        marginLeft: -8,
    },
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      marginHorizontal: -6,
      marginTop: 12,
      marginBottom: 18,
    },
    summaryCard: {
      flex: 1,
      marginHorizontal: 6,
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 16,
      padding: 16,
      // Using shadow instead of borders
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryLabel: {
      color: tokens.mutedForeground,
      marginBottom: 8,
      fontSize: 13,
    },
    summaryValue: {
      color: tokens.foreground,
      fontWeight: '700',
      fontSize: 18,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: tokens.muted,
        marginHorizontal: -16,
        marginBottom: 8,
    },
    listHeaderLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: tokens.mutedForeground,
        letterSpacing: 0.5,
    },
    listContainer: {
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 16,
      overflow: 'hidden',
    },
  });

export default SuppliersListScreen;

