import React, { useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import CustomerCard, { Customer } from '../../components/CustomerCard';
import FAB from '../../components/ui/FAB';
import { Linking, Share } from 'react-native';
import { useSuppliers } from '../../logic/partyLogic';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Users, AlertTriangle, UserPlus } from 'lucide-react-native';
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

  const normalizedSuppliers: Customer[] = useMemo(() => {
    return suppliers.map(party => ({
      id: party.id,
      name: party.name ?? 'Untitled Vendor',
      businessType: 'Supplier',
      location: party.address ?? '—',
      dueAmount: party.balance ?? 0, 
      totalSale: 0,
      lastInvoice: party.updated_at
        ? new Date(party.updated_at).toLocaleDateString('en-IN', {
            month: 'short',
            day: '2-digit',
          })
        : '—',
      status: (party.balance ?? 0) > 0 ? 'due' : 'clear',
      phone: party.phone || party.mobile || 'N/A',
    }));
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    return normalizedSuppliers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [normalizedSuppliers, searchTerm]);

  const handlePhonePress = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleMessagePress = useCallback((phone: string) => {
    Linking.openURL(`sms:${phone}`);
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
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
          placeholder="Search suppliers..."
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
                suppliers.reduce((acc, curr) => acc + (curr.balance ?? 0), 0)
              )}
            </Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          {isLoading && !isRefetching && (
             <ActivityIndicator size="large" color={tokens.primary} style={{ marginTop: 20 }} />
          )}

          {!isLoading && error && (
            <EmptyState
              icon={<AlertTriangle color={tokens.destructive} size={32} />}
              title="Unable to load suppliers"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={refetch}
            />
          )}

          {!isLoading && !error && filteredSuppliers.length === 0 && (
            <EmptyState
              icon={<UserPlus color={tokens.primary} size={32} />}
              title="No vendors found"
              description="You haven't added any vendors. Add one to track purchases."
              actionLabel="Add Vendor"
              onAction={() => navigation.navigate('PurchaseCreateVendor', {})}
            />
          )}

          {filteredSuppliers.map(supplier => (
            <CustomerCard
              key={supplier.id}
              customer={supplier}
              onPress={() => {
                // Future Implementation for Supplier Detail
                // navigation.navigate('SupplierDetail', { supplier }) 
              }}
              onPhonePress={() => handlePhonePress(supplier.phone)}
              onMessagePress={() => handleMessagePress(supplier.phone)}
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
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
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
      backgroundColor: tokens.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border,
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
    listContainer: {
      marginTop: 4,
    },
  });

export default SuppliersListScreen;
