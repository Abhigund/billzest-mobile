import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import ScreenWrapper from '../../components/ScreenWrapper';
import DetailHeader from '../../components/DetailHeader';
import {
  Phone,
  MessageCircle,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  CreditCard,
} from 'lucide-react-native';
import Button from '../../components/ui/Button';
import { usePartyLedger } from '../../hooks/useCredit';
import EmptyState from '../../components/EmptyState';
import type { AppNavigationParamList } from '../../navigation/types';

const PartyLedgerScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const route = useRoute<RouteProp<AppNavigationParamList, 'PartyLedgerScreen'>>();
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();

  // Params passed from list
  const party = route.params?.party || {
    id: '',
    name: 'Unknown Party',
    mobile: '',
    party_type: 'customer',
    balance: 0,
  };

  // Fetch comprehensive ledger data
  const { data: ledger, isLoading, error } = usePartyLedger(party.id);

  // Calculate display values
  const displayBalance = useMemo(() => {
    if (!ledger) return party.balance || 0;
    return ledger.closingBalance;
  }, [ledger, party.balance]);

  const toCollect = useMemo(() => {
    if (!ledger) return 0;
    return ledger.toCollect;
  }, [ledger]);

  const toPay = useMemo(() => {
    if (!ledger) return 0;
    return ledger.toPay;
  }, [ledger]);

  const handleCall = () => {
    Linking.openURL(`tel:${party.mobile}`);
  };

  const handleWhatsApp = () => {
    if (!party.mobile) {
      Alert.alert('Error', 'Mobile number not available');
      return;
    }
    const balanceText =
      toCollect > 0
        ? `your outstanding balance is ₹${toCollect.toLocaleString(
            'en-IN',
          )}. Please pay soon.`
        : toPay > 0
        ? `we owe you ₹${toPay.toLocaleString('en-IN')}.`
        : 'your account is settled.';
    const text = `Hi ${party.name}, ${balanceText}`;
    Linking.openURL(
      `whatsapp://send?phone=91${party.mobile}&text=${encodeURIComponent(
        text,
      )}`,
    ).catch(() => Alert.alert('Error', 'WhatsApp not installed'));
  };

  return (
    <ScreenWrapper>
      <DetailHeader
        title={party.name || 'Party Ledger'}
        actions={[
          {
            icon: <Phone size={18} color={tokens.foreground} />,
            onPress: handleCall,
            accessibilityLabel: 'Call party',
          },
          {
            icon: <MessageCircle size={18} color={tokens.foreground} />,
            onPress: handleWhatsApp,
            accessibilityLabel: 'Send WhatsApp message',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.primary} />
            <Text
              style={[styles.loadingText, { color: tokens.mutedForeground }]}
            >
              Loading ledger...
            </Text>
          </View>
        ) : error ? (
          <EmptyState
            icon={<FileText color={tokens.destructive} size={32} />}
            title="Unable to load ledger"
            description="Please try again later."
          />
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: tokens.card, borderColor: tokens.primary },
                ]}
              >
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: tokens.mutedForeground },
                  ]}
                >
                  To Collect
                </Text>
                <Text style={[styles.summaryValue, { color: tokens.primary }]}>
                  ₹{toCollect.toLocaleString('en-IN')}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: tokens.card,
                    borderColor: tokens.destructive,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: tokens.mutedForeground },
                  ]}
                >
                  To Pay
                </Text>
                <Text
                  style={[styles.summaryValue, { color: tokens.destructive }]}
                >
                  ₹{toPay.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text
                  style={[
                    styles.balanceValue,
                    displayBalance > 0
                      ? styles.receivable
                      : displayBalance < 0
                      ? styles.payable
                      : {},
                  ]}
                >
                  ₹{Math.abs(displayBalance).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.balanceStatus}>
                  {displayBalance > 0
                    ? 'You will get'
                    : displayBalance < 0
                    ? 'You will give'
                    : 'Settled'}
                </Text>
                {ledger && (
                  <View style={styles.balanceDetails}>
                    <Text
                      style={[
                        styles.balanceDetailText,
                        { color: tokens.mutedForeground },
                      ]}
                    >
                      Total Credit: ₹
                      {ledger.totalCredit.toLocaleString('en-IN')}
                    </Text>
                    <Text
                      style={[
                        styles.balanceDetailText,
                        { color: tokens.mutedForeground },
                      ]}
                    >
                      Total Debit: ₹{ledger.totalDebit.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.actionButtons}>
                {party.mobile && (
                  <>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleCall}
                    >
                      <Phone color={tokens.primary} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleWhatsApp}
                    >
                      <MessageCircle color={tokens.primary} size={20} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Transactions List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Transactions ({ledger?.transactions.length || 0})
              </Text>
            </View>

            {!ledger || ledger.transactions.length === 0 ? (
              <EmptyState
                icon={<Receipt color={tokens.mutedForeground} size={32} />}
                title="No transactions yet"
                description="Start by creating an invoice or recording a payment."
              />
            ) : (
              ledger.transactions.map(txn => (
                <View key={txn.id} style={styles.txnRow}>
                  <View style={styles.txnLeft}>
                    <Text style={styles.txnDate}>
                      {new Date(txn.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.txnYear,
                        { color: tokens.mutedForeground },
                      ]}
                    >
                      {new Date(txn.date).getFullYear()}
                    </Text>
                  </View>
                  <View style={styles.txnCenter}>
                    <View style={styles.txnIconContainer}>
                      {txn.type === 'order' ? (
                        <Receipt size={16} color={tokens.destructive} />
                      ) : txn.type === 'payment' ? (
                        <CreditCard size={16} color={tokens.primary} />
                      ) : (
                        <FileText size={16} color={tokens.mutedForeground} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txnDesc}>
                        {txn.description || 'Transaction'}
                      </Text>
                      <View style={styles.txnMetaRow}>
                        {txn.invoiceNumber && (
                          <Text
                            style={[
                              styles.txnMeta,
                              { color: tokens.mutedForeground },
                            ]}
                          >
                            Invoice #{txn.invoiceNumber}
                          </Text>
                        )}
                        {txn.paymentMethod && (
                          <Text
                            style={[
                              styles.txnMeta,
                              { color: tokens.mutedForeground },
                            ]}
                          >
                            • {txn.paymentMethod}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.txnRight}>
                    <Text
                      style={[
                        styles.txnAmount,
                        txn.type === 'payment' ? styles.received : styles.given,
                      ]}
                    >
                      {txn.type === 'payment' ? '+' : '-'} ₹
                      {Number(txn.amount).toLocaleString('en-IN')}
                    </Text>
                    <Text
                      style={[
                        styles.txnBalance,
                        { color: tokens.mutedForeground },
                      ]}
                    >
                      Balance: ₹{txn.runningBalance.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerButtonContainer}>
          <Button
            label="Gave Credit"
            variant="destructive"
            fullWidth
            onPress={() =>
              navigation.navigate('AddCreditTransactionSheet', {
                party,
                mode: 'given',
              })
            }
            icon={<ArrowUpRight size={18} color="white" />}
          />
        </View>
        <View style={styles.gap} />
        <View style={styles.footerButtonContainer}>
          <Button
            label="Got Payment"
            variant="primary"
            fullWidth
            onPress={() =>
              navigation.navigate('AddCreditTransactionSheet', {
                party,
                mode: 'received',
              })
            }
            icon={<ArrowDownLeft size={18} color="white" />}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    content: {
      padding: 20,
      paddingBottom: 100,
    },
    balanceCard: {
      backgroundColor: tokens.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: tokens.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    balanceLabel: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginBottom: 4,
    },
    balanceValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 2,
    },
    balanceStatus: {
      fontSize: 12,
      color: tokens.mutedForeground,
    },

    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: tokens.background,
      borderWidth: 1,
      borderColor: tokens.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: tokens.foreground,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    summaryCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    summaryLabel: {
      fontSize: 12,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
    },
    balanceDetails: {
      marginTop: 8,
      gap: 4,
    },
    balanceDetailText: {
      fontSize: 11,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
    },
    txnRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    txnLeft: {
      width: 60,
    },
    txnDate: {
      fontSize: 12,
      color: tokens.foreground,
      fontWeight: '600',
    },
    txnYear: {
      fontSize: 10,
      marginTop: 2,
    },
    txnCenter: {
      flex: 1,
      paddingHorizontal: 10,
      flexDirection: 'row',
      gap: 8,
    },
    txnIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: tokens.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    txnDesc: {
      fontSize: 14,
      color: tokens.foreground,
      fontWeight: '500',
      marginBottom: 4,
    },
    txnMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    txnMeta: {
      fontSize: 11,
    },
    txnRight: {
      alignItems: 'flex-end',
      minWidth: 100,
    },
    txnAmount: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    txnBalance: {
      fontSize: 11,
    },
    received: { color: tokens.primary }, // Green
    given: { color: tokens.destructive }, // Red
    receivable: { color: tokens.primary },
    payable: { color: tokens.destructive },

    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      padding: 16,
      backgroundColor: tokens.background,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
    },
    footerButtonContainer: {
      flex: 1,
    },
    gap: {
      width: 12,
    },
  });

export default PartyLedgerScreen;
