import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenWrapper from '../../components/ScreenWrapper';
import DetailHeader from '../../components/DetailHeader';
import Button from '../../components/ui/Button';
import { useProducts } from '../../logic/productLogic';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ThemeTokens } from '../../theme/tokens';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { Search, Plus, Minus, Trash2, Printer } from 'lucide-react-native';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import type { ProductsStackParamList } from '../../navigation/types';

interface SelectedProduct {
  id: string;
  name: string;
  barcode: string;
  selling_price: number;
  quantity: number;
}

type BarcodeGeneratorRoute = RouteProp<
  {
    BarcodeGenerator: {
      initialItems?: {
        id: string;
        name: string;
        barcode: string;
        selling_price: number;
        quantity: number;
      }[];
    };
  },
  'BarcodeGenerator'
>;

const BarcodeGeneratorScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation =
    useNavigation<NativeStackNavigationProp<ProductsStackParamList>>();
  const route = useRoute<BarcodeGeneratorRoute>();
  const { organizationId } = useOrganization();
  const { data: products } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedProduct>>({});
  const [storeName, setStoreName] = useState('My Store');
  const [showStoreName, setShowStoreName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  // Load initial items if provided
  React.useEffect(() => {
    if (route.params?.initialItems) {
      const newItems: Record<string, SelectedProduct> = {};
      route.params.initialItems.forEach(item => {
        newItems[item.id] = item;
      });
      setSelectedItems(newItems);
    }
  }, [route.params?.initialItems]);
  
  // Basic search filter
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products.filter((p) => 
      p.name.toLowerCase().includes(query) || 
      (p.barcode && p.barcode.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [products, searchQuery]);

  const handleAddProduct = (product: any) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[product.id]) {
        next[product.id] = { ...next[product.id], quantity: next[product.id].quantity + 1 };
      } else {
        next[product.id] = {
          id: product.id,
          name: product.name,
          barcode: product.barcode || '',
          selling_price: product.selling_price || 0,
          quantity: 1,
        };
      }
      return next;
    });
    setSearchQuery('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      const item = next[id];
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        delete next[id];
      } else {
        next[id] = { ...item, quantity: newQty };
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (Object.keys(selectedItems).length === 0) {
      Alert.alert('No Items', 'Please add products to generate barcodes.');
      return;
    }

    try {
      // Build HTML for print
      let labelsHtml = '';
      const itemsArr = Object.values(selectedItems);
      itemsArr.forEach(item => {
        // Simple JSBarcode usage via CDN in HTML
        for (let i = 0; i < item.quantity; i++) {
          labelsHtml += `
            <div class="label-container">
              ${showStoreName ? `<div class="store-name">${storeName}</div>` : ''}
              <div class="product-name">${item.name}</div>
              <svg class="barcode"
                jsbarcode-value="${item.barcode || '0000000000'}"
                jsbarcode-width="1.5"
                jsbarcode-height="40"
                jsbarcode-fontSize="12"
                jsbarcode-margin="0">
              </svg>
              ${showPrice ? `<div class="price">Rs. ${item.selling_price}</div>` : ''}
            </div>
          `;
        }
      });

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
          <style>
            @page { margin: 0; }
            body { 
              margin: 0; 
              padding: 10px;
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              justify-content: flex-start;
              font-family: Arial, sans-serif;
            }
            .label-container {
              width: 150px;
              height: 100px;
              border: 1px dashed #ccc;
              padding: 8px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
            }
            .store-name { font-size: 10px; font-weight: bold; margin-bottom: 2px; }
            .product-name { font-size: 11px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
            .price { font-size: 12px; font-weight: bold; margin-top: 2px; }
            svg.barcode { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            JsBarcode(".barcode").init();
          </script>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
         // Not fully supported in Expo Go Web without extra setup, but standard fallback
         Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate barcodes.');
    }
  };

  const selectedItemsList = Object.values(selectedItems);

  return (
    <ScreenWrapper>
      <DetailHeader title="Barcode Generator" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Search color={tokens.mutedForeground} size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={tokens.mutedForeground}
            />
          </View>
        </View>

        {/* Autocomplete Results */}
        {searchQuery.length > 0 && (
          <View style={styles.searchResults}>
            {filteredProducts.map(p => (
              <Button 
                key={p.id}
                variant="outline"
                style={styles.searchResultItem}
                labelStyle={styles.searchResultLabel}
                label={`${p.name} - ₹${p.selling_price || 0}`}
                onPress={() => handleAddProduct(p)}
              />
            ))}
            {filteredProducts.length === 0 && (
               <Text style={styles.noResultText}>No products found.</Text>
            )}
          </View>
        )}

        <ScrollView style={styles.listContainer} keyboardShouldPersistTaps="handled">
            {selectedItemsList.length === 0 ? (
              <View style={styles.emptyState}>
                <Printer size={40} color={tokens.mutedForeground} opacity={0.3} />
                <Text style={styles.emptyStateText}>Search and add products to generate barcodes.</Text>
              </View>
            ) : (
               <View style={styles.itemsList}>
                 {selectedItemsList.map(item => (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={{flex: 1}}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.itemSub}>{item.barcode ? `Barcode: ${item.barcode}` : 'NO BARCODE'}</Text>
                      </View>
                      <View style={styles.qtyControls}>
                        <Button variant="ghost" icon={<Minus size={16} color={tokens.foreground} />} onPress={() => updateQuantity(item.id, -1)} />
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <Button variant="ghost" icon={<Plus size={16} color={tokens.foreground} />} onPress={() => updateQuantity(item.id, 1)} />
                      </View>
                    </View>
                 ))}
               </View>
            )}

            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Label Settings</Text>
              <View style={styles.settingItem}>
                 <Text style={styles.settingLabel}>Store Name</Text>
                 <TextInput
                   style={styles.textInput}
                   value={storeName}
                   onChangeText={setStoreName}
                 />
              </View>
              <View style={styles.settingRow}>
                <Button 
                  variant={showStoreName ? 'primary' : 'outline'} 
                  label="Show Store" 
                  onPress={() => setShowStoreName(!showStoreName)} 
                  style={{flex: 1, paddingVertical: 8}}
                />
                <View style={{width: 8}} />
                <Button 
                  variant={showPrice ? 'primary' : 'outline'} 
                  label="Show Price" 
                  onPress={() => setShowPrice(!showPrice)} 
                  style={{flex: 1, paddingVertical: 8}}
                />
              </View>
            </View>
        </ScrollView>

        <View style={styles.footer}>
           <Button label="Generate Print PDF" icon={<Printer size={18} color="white" />} onPress={handleGenerate} fullWidth />
        </View>

      </View>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
    backgroundColor: tokens.background,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: tokens.foreground,
    fontSize: 16,
  },
  searchResults: {
    position: 'absolute',
    top: 68,
    left: 16,
    right: 16,
    backgroundColor: tokens.background,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: 8,
    maxHeight: 250,
    zIndex: 10,
    elevation: 5,
    shadowColor: tokens.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden'
  },
  searchResultItem: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
    borderRadius: 0,
    justifyContent: 'flex-start',
    paddingVertical: 12,
  },
  searchResultLabel: {
    fontWeight: 'normal',
  },
  noResultText: {
    padding: 16,
    color: tokens.mutedForeground,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: tokens.mutedForeground,
    marginTop: 16,
    textAlign: 'center',
  },
  itemsList: {
    gap: 12,
    marginBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.card,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: 12,
    padding: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.foreground,
  },
  itemSub: {
    fontSize: 12,
    color: tokens.mutedForeground,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  qtyText: {
    fontWeight: '600',
    color: tokens.foreground,
    minWidth: 24,
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: tokens.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.border,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.foreground,
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 13,
    color: tokens.mutedForeground,
    marginBottom: 4,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: tokens.background,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: tokens.foreground,
    fontSize: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: tokens.border,
    backgroundColor: tokens.background,
  }
});

export default BarcodeGeneratorScreen;
