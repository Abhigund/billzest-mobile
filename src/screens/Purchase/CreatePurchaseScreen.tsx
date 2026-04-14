import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import ScreenWrapper from '../../components/ScreenWrapper';
import DetailHeader from '../../components/DetailHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Plus, FileText, Truck, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreatePurchase } from '../../logic/purchaseLogic';
import ItemSelectionSheet from '../../components/modals/ItemSelectionSheet';
import PartyDropdown from '../../components/ui/PartyDropdown';
import { Product } from '../../types/domain';
import { generatePurchaseOrderNumber } from '../../utils/invoiceNumberGenerator';
import EmptyState from '../../components/EmptyState';
import { RefreshControl } from 'react-native';
import type { AppNavigationParamList } from '../../navigation/types';

const DEFAULT_ITEMS = [
  {
    id: 'row-1',
    product: '',
    productId: '',
    sku: '',
    unitPrice: '',
    quantity: '',
  },
];

const CreatePurchaseScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const createPurchase = useCreatePurchase();
  const [isProductSheetVisible, setProductSheetVisible] = React.useState(false);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  const [selectedSupplier, setSelectedSupplier] = React.useState<any>(null);
  const [orderNumber, setOrderNumber] = React.useState('');
  const [orderDate, setOrderDate] = React.useState('');
  const [items, setItems] = React.useState(DEFAULT_ITEMS);
  const [notes, setNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [orderDateValue, setOrderDateValue] = React.useState(new Date());

  // Auto-generate order number on mount
  React.useEffect(() => {
    const generateOrderNumber = async () => {
      try {
        const generated = await generatePurchaseOrderNumber();
        setOrderNumber(generated);
      } catch (err) {
        // Fallback to timestamp-based number
        setOrderNumber(`PO-${Date.now()}`);
      }
    };
    if (!orderNumber) {
      generateOrderNumber();
    }
  }, []);

  // Initialize order date
  React.useEffect(() => {
    if (!orderDate) {
      setOrderDate(orderDateValue.toISOString().split('T')[0]);
    }
  }, []);

  // Listen for when screen comes back into focus (e.g., after creating a vendor)
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes back into focus, check if we need to refresh parties
      // The PartyDropdown will automatically refresh via query invalidation from AddPartySheet
      // The newly created vendor will appear in the dropdown list
    }, [])
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setOrderDateValue(selectedDate);
      setOrderDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const updateItem = (
    id: string,
    key: 'product' | 'unitPrice' | 'quantity',
    value: string,
  ) => {
    setItems(current =>
      current.map(item => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  const handleProductSelect = (product: Product) => {
    if (!activeItemId) return;
    setItems(current =>
      current.map(item =>
        item.id === activeItemId
          ? {
              ...item,
              product: product.name,
              productId: product.id,
              sku: product.sku || '',
              unitPrice: product.selling_price ? String(product.selling_price) : item.unitPrice,
            }
          : item,
      ),
    );
    setProductSheetVisible(false);
    setActiveItemId(null);
  };

  const openProductSheet = (itemId: string) => {
    setActiveItemId(itemId);
    setProductSheetVisible(true);
  };

  const addItem = () => {
    setItems(current => [
      ...current,
      {
        id: `row-${Date.now()}`,
        product: '',
        productId: '',
        sku: '',
        unitPrice: '',
        quantity: '',
      },
    ]);
  };

  // Calculate totals with proper validation
  const subtotal = React.useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = parseFloat(item.quantity) || 0;
      return sum + price * qty;
    }, 0);
  }, [items]);

  const totalQuantity = React.useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0,
    );
  }, [items]);

  const grandTotal = subtotal; // No tax for purchases currently

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const handleRecordPurchase = async () => {
    setError(null);
    
    // Validation
    if (!selectedSupplier) {
      setError('Please select a vendor or supplier to continue.');
      Alert.alert('Select vendor', 'Choose a vendor or supplier to continue.');
      return;
    }

    const parsedItems = items
      .map(item => ({
        product_id: item.productId || null,
        product_name: item.product || 'Untitled item',
        sku: item.sku || null,
        unit_price: parseFloat(item.unitPrice) || 0,
        quantity: parseFloat(item.quantity) || 0,
      }))
      .filter(item => item.quantity > 0);

    const invalidItems = parsedItems.filter(item => !item.product_id);
    if (invalidItems.length > 0) {
      setError('Please select a product for all items.');
      Alert.alert('Missing Product', 'Please select a product for all items.');
      return;
    }

    if (parsedItems.length === 0) {
      setError('Add at least one item with quantity.');
      Alert.alert('Add items', 'Add at least one item with quantity.');
      return;
    }

    // Validate order date
    let orderDateValue: Date;
    if (orderDate.trim()) {
      orderDateValue = new Date(orderDate);
      if (isNaN(orderDateValue.getTime())) {
        setError('Please enter a valid date in YYYY-MM-DD format.');
        Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format.');
        return;
      }
    } else {
      orderDateValue = new Date();
    }

    // Generate order number if not provided
    let finalOrderNumber = orderNumber.trim();
    if (!finalOrderNumber) {
      try {
        finalOrderNumber = await generatePurchaseOrderNumber();
        setOrderNumber(finalOrderNumber);
      } catch (err) {
        finalOrderNumber = `PO-${Date.now()}`;
      }
    }

    const payload = {
      purchase: {
        order_number: finalOrderNumber,
        vendor_name: selectedSupplier.name,
        vendor_phone: selectedSupplier.phone || null,
        order_date: orderDateValue.toISOString(),
        total_quantity: totalQuantity,
        total_amount: grandTotal,
        status: 'completed',
        notes: notes.trim() || null,
      },
      items: parsedItems.map(i => ({
        product_id: i.product_id as string, // Validated above
        product_name: i.product_name,
        sku: i.sku,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.unit_price * i.quantity,
      })),
    };

    setIsSubmitting(true);
    try {
      const created = await createPurchase.mutateAsync(payload);
      setIsSubmitting(false);
      Alert.alert(
        'Success',
        'Purchase order created successfully. Stock has been updated.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('PurchaseDetail', {
                purchaseId: created.id,
                purchase: created,
              });
            },
          },
        ]
      );
    } catch (err: any) {
      setIsSubmitting(false);
      const errorMessage = err?.message ?? 'Unable to create purchase. Please try again.';
      setError(errorMessage);
      Alert.alert('Failed to save', errorMessage);
    }
  };

  return (
    <ScreenWrapper>
      <DetailHeader title="Record Purchase" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.subtitle}>
            Bring new stock into inventory with supplier bills and cost
            tracking.
          </Text>
          <View style={styles.badge}>
            <FileText color={tokens.primary} size={16} />
            <Text style={styles.badgeText}>P.O Template</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <PartyDropdown
            selectedParty={selectedSupplier}
            onSelectParty={setSelectedSupplier}
            mode="purchase"
            onAddNew={() => {
              // Navigate to add party screen
              navigation.navigate('AddPartySheet', { intent: 'purchase' });
            }}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Purchase Details</Text>
            <Truck color={tokens.primary} size={16} />
          </View>
          <Input
            label="Order Number"
            value={orderNumber}
            onChangeText={setOrderNumber}
            placeholder="Auto-generated"
            containerStyle={styles.field}
            editable={true}
          />
          <View style={styles.field}>
            <Text style={styles.inputLabel}>Order Date</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar color={tokens.primary} size={18} />
              <Text style={styles.dateText}>
                {orderDate || orderDateValue.toISOString().split('T')[0]}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={orderDateValue}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <Pressable
                style={styles.datePickerDoneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </Pressable>
            )}
          </View>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
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
              <Pressable
                style={{ flex: 2, marginRight: 8 }}
                onPress={() => openProductSheet(item.id)}
              >
                <View pointerEvents="none">
                  <Input
                    value={item.product}
                    placeholder="Select Product"
                    containerStyle={styles.itemField}
                    editable={false}
                  />
                </View>
              </Pressable>

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
            placeholder="Purchase note"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Items</Text>
            <Text style={styles.totalValue}>{items.filter(i => i.productId).length}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Quantity</Text>
            <Text style={styles.totalValue}>{totalQuantity}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelBold}>Total Purchase</Text>
            <Text style={styles.totalValueBold}>
              {formatCurrency(grandTotal)}
            </Text>
          </View>
        </View>

        <View style={styles.actionsStack}>
          <Button
            label="Save Draft"
            variant="secondary"
            fullWidth
            style={styles.stackSpacing}
            disabled={isSubmitting || createPurchase.isPending}
          />
          <Button
            label={isSubmitting || createPurchase.isPending ? 'Saving…' : 'Record Purchase'}
            fullWidth
            onPress={handleRecordPurchase}
            disabled={isSubmitting || createPurchase.isPending}
          />
        </View>


        <ItemSelectionSheet
          visible={isProductSheetVisible}
          onClose={() => setProductSheetVisible(false)}
          onSelectProduct={handleProductSelect}
          onUpdateQuantity={(productId, delta) => {
            // Find item by productId
            const item = items.find(i => i.productId === productId);
            if (item) {
              const currentQty = parseFloat(item.quantity) || 0;
              const newQty = Math.max(0, currentQty + delta);
              updateItem(item.id, 'quantity', String(newQty));
            } else if (delta > 0 && activeItemId) {
              // If product not in items and we're adding, select it for the active row
              // This will be handled by handleProductSelect when product is selected
            }
          }}
          currentItems={items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          }))}
        />
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
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: tokens.foreground,
    },
    subtitle: {
      color: tokens.mutedForeground,
      marginTop: 6,
      maxWidth: 240,
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
    sectionHeader: {
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
    selectCard: {
      marginTop: -6,
      marginBottom: 0,
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
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
      marginBottom: 6,
    },
    supplierChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginHorizontal: 6,
      marginBottom: 8,
      backgroundColor: tokens.background,
    },
    supplierChipActive: {
      backgroundColor: tokens.primary,
      borderColor: tokens.primary,
    },
    supplierChipText: {
      color: tokens.foreground,
      fontWeight: '600',
    },
    supplierChipTextActive: {
      color: tokens.primaryForeground,
    },
    supplierMeta: {
      color: tokens.mutedForeground,
      marginTop: 4,
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
      flexDirection: 'row',
      alignItems: 'center',
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
    stackSpacing: {
      marginBottom: 12,
    },
    errorContainer: {
      marginTop: 8,
      padding: 12,
      backgroundColor: tokens.destructive + '15',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.destructive + '30',
    },
    errorText: {
      color: tokens.destructive,
      fontSize: 13,
      fontWeight: '500',
    },
    inputLabel: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginBottom: 6,
      fontWeight: '600',
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
    },
    dateText: {
      fontSize: 15,
      color: tokens.foreground,
      fontWeight: '500',
    },
    datePickerDoneButton: {
      marginTop: 12,
      alignSelf: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    datePickerDoneText: {
      color: tokens.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default CreatePurchaseScreen;
