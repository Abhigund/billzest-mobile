import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import ScreenWrapper from '../../components/ScreenWrapper';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Plus, FileText, Truck } from 'lucide-react-native';
import PartyDropdown from '../../components/ui/PartyDropdown';
import { useCreatePurchase } from '../../logic/purchaseLogic';
import { useCreateOrder } from '../../logic/orderLogic';
import type { AppNavigationParamList } from '../../navigation/types';

const DEFAULT_ITEMS = [
  { id: 'row-1', product: '', unitPrice: '', quantity: '' },
];

type Mode = 'sale' | 'purchase';

const BillingScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const route = useRoute<RouteProp<AppNavigationParamList, 'AddSale'>>();
  const createPurchase = useCreatePurchase();
  const createInvoice = useCreateOrder();

  const initialModeParam =
    (route.params?.initialMode as Mode | undefined) ?? 'sale';
  const [mode, setMode] = React.useState<Mode>(initialModeParam);
  const [selectedParty, setSelectedParty] = React.useState<any>(null);
  const [docNumber, setDocNumber] = React.useState('');
  const [docDate, setDocDate] = React.useState('');
  const [items, setItems] = React.useState(DEFAULT_ITEMS);
  const [notes, setNotes] = React.useState('');

  const updateItem = (
    id: string,
    key: 'product' | 'unitPrice' | 'quantity',
    value: string,
  ) => {
    setItems(current =>
      current.map(item => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  const addItem = () => {
    setItems(current => [
      ...current,
      { id: `row-${Date.now()}`, product: '', unitPrice: '', quantity: '' },
    ]);
  };

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice) || 0;
    const qty = parseFloat(item.quantity) || 0;
    return sum + price * qty;
  }, 0);
  const totalQuantity = items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0),
    0,
  );
  const grandTotal = subtotal;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const handleSave = async () => {
    if (!selectedParty) {
      Alert.alert('Select party', 'Choose a party before saving.');
      return;
    }

    const parsedItems = items
      .map((item: any, index: number) => ({
        id: item.id || item.product_id || String(index),
        name: item.product || 'Untitled item',
        unit_price: parseFloat(item.unitPrice) || 0,
        quantity: parseFloat(item.quantity) || 0,
      }))
      .filter((item: any) => item.quantity > 0);

    if (parsedItems.length === 0) {
      Alert.alert('Add items', 'Add at least one item with quantity.');
      return;
    }

    const docDateParsed = new Date(docDate);
    const isoDate = isNaN(docDateParsed.getTime())
      ? new Date().toISOString()
      : docDateParsed.toISOString();

    if (mode === 'purchase') {
      try {
        const created = await createPurchase.mutateAsync({
          purchase: {
            order_number: docNumber || `PO-${Date.now()}`,
            vendor_name: selectedParty.name,
            vendor_phone: selectedParty.phone || null,
            order_date: isoDate,
            total_quantity: totalQuantity,
            total_amount: grandTotal,
            status: 'completed',
            notes: notes.trim() || null,
          },
          items: parsedItems.map(i => ({
            product_name: i.name,
            sku: null,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.unit_price * i.quantity,
          })),
        });

        navigation.navigate('PurchaseDetail', {
          purchaseId: created.id,
          purchase: created,
        });
      } catch (err: any) {
        Alert.alert(
          'Failed to save',
          err?.message ?? 'Unable to create purchase.',
        );
      }
    } else {
      // sale -> invoice
      try {
        const issueDate = isoDate;
        const due = new Date(issueDate);
        due.setDate(new Date(issueDate).getDate() + 7);

        const created = await createInvoice.mutateAsync({
          order: {
            party_id: selectedParty.id,
            invoice_number: docNumber || `INV-${Date.now()}`,
            status: 'sent',
            payment_status: 'PENDING',
            subtotal,
            tax_amount: 0,
            total_amount: grandTotal,
            notes: notes.trim() || null,
          },
          items: parsedItems.map(i => ({
            product_id: i.id,
            product_name: i.name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.unit_price * i.quantity,
          })),
        });

        navigation.navigate('InvoiceDetail', {
          orderId: created.id,
          invoice: created,
        });
      } catch (err: any) {
        Alert.alert(
          'Failed to save',
          err?.message ?? 'Unable to create invoice.',
        );
      }
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerBlock}>
          <View style={styles.modeToggleRow}>
            <Pressable
              style={[
                styles.modePill,
                mode === 'sale' && styles.modePillActive,
              ]}
              onPress={() => setMode('sale')}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === 'sale' && styles.modeTextActive,
                ]}
              >
                Sale
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modePill,
                mode === 'purchase' && styles.modePillActive,
              ]}
              onPress={() => setMode('purchase')}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === 'purchase' && styles.modeTextActive,
                ]}
              >
                Purchase
              </Text>
            </Pressable>
          </View>
          <View style={styles.badge}>
            <FileText color={tokens.primary} size={16} />
            <Text style={styles.badgeText}>
              {mode === 'sale' ? 'Invoice' : 'P.O'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <PartyDropdown
            selectedParty={selectedParty}
            onSelectParty={setSelectedParty}
            mode={mode}
            onAddNew={() => {
              // Navigate to add party screen
              navigation.navigate('AddPartySheet', { intent: mode });
            }}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Document Details</Text>
            <Text style={styles.sectionMeta}>
              {mode === 'sale' ? 'Invoice' : 'Purchase Order'}
            </Text>
          </View>
          <Input
            label={mode === 'sale' ? 'Invoice Number' : 'Order Number'}
            value={docNumber}
            onChangeText={setDocNumber}
            placeholder={mode === 'sale' ? 'INV-0001' : 'PO-0001'}
            containerStyle={styles.field}
          />
          <Input
            label={mode === 'sale' ? 'Issue Date' : 'Order Date'}
            value={docDate}
            onChangeText={setDocDate}
            placeholder="YYYY-MM-DD"
            containerStyle={styles.field}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Items & Cost</Text>
            <Text style={styles.sectionMeta}>{items.length} items</Text>
          </View>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, { flex: 2 }]}>Item</Text>
            <Text
              style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}
            >
              Unit Price
            </Text>
            <Text
              style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}
            >
              Qty
            </Text>
          </View>
          {items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Input
                value={item.product}
                onChangeText={value => updateItem(item.id, 'product', value)}
                placeholder="Product name"
                containerStyle={styles.itemField}
              />
              <Input
                value={item.unitPrice}
                onChangeText={value => updateItem(item.id, 'unitPrice', value)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                containerStyle={styles.itemFieldCompact}
              />
              <Input
                value={item.quantity}
                onChangeText={value => updateItem(item.id, 'quantity', value)}
                placeholder="0"
                keyboardType="number-pad"
                containerStyle={styles.itemFieldCompact}
              />
            </View>
          ))}
          <Pressable style={styles.addRowButton} onPress={addItem}>
            <Plus color={tokens.primary} size={16} />
            <Text style={styles.addRowText}>Add another item</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Add note"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Quantity</Text>
            <Text style={styles.totalValue}>{totalQuantity}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelBold}>Total</Text>
            <Text style={styles.totalValueBold}>
              {formatCurrency(grandTotal)}
            </Text>
          </View>
        </View>

        <View style={styles.actionsStack}>
          <Button
            label={mode === 'sale' ? 'Save Invoice' : 'Save Purchase'}
            fullWidth
            onPress={handleSave}
            disabled={createPurchase.isPending || createInvoice.isPending}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 80,
    },
    headerBlock: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },
    modeToggleRow: {
      flexDirection: 'row',
      backgroundColor: tokens.card,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 4,
    },
    modePill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      marginRight: 4,
      backgroundColor: tokens.background,
    },
    modePillActive: {
      backgroundColor: tokens.primary,
    },
    modeText: {
      fontWeight: '600',
      color: tokens.foreground,
    },
    modeTextActive: {
      color: tokens.primaryForeground,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: tokens.card,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    badgeText: {
      marginLeft: 6,
      color: tokens.primary,
      fontWeight: '600',
    },
    sectionCard: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 16,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
    },
    sectionMeta: {
      color: tokens.mutedForeground,
      fontSize: 13,
    },
    field: {
      marginBottom: 12,
    },
    selectRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: tokens.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.border,
    },
    label: {
      fontSize: 12,
      color: tokens.mutedForeground,
    },
    value: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.foreground,
    },
    meta: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 2,
    },
    tableHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    tableHeadText: {
      fontSize: 12,
      color: tokens.mutedForeground,
      fontWeight: '600',
    },
    itemRow: {
      marginBottom: 12,
    },
    itemField: {
      marginBottom: 8,
    },
    itemFieldCompact: {
      marginBottom: 8,
    },
    addRowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    addRowText: {
      marginLeft: 8,
      fontWeight: '600',
      color: tokens.primary,
    },
    totalsCard: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 18,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    totalLabel: {
      color: tokens.mutedForeground,
    },
    totalValue: {
      color: tokens.foreground,
      fontWeight: '600',
    },
    totalLabelBold: {
      color: tokens.foreground,
      fontWeight: '700',
    },
    totalValueBold: {
      color: tokens.foreground,
      fontWeight: '700',
      fontSize: 18,
    },
    divider: {
      height: 1,
      backgroundColor: tokens.border,
      marginVertical: 10,
    },
    actionsStack: {
      marginBottom: 24,
    },
  });

export default BillingScreen;
