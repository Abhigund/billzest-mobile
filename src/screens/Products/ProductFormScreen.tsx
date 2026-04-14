import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DetailHeader from '../../components/DetailHeader';
import { ThemeTokens } from '../../theme/tokens';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { Product } from '../../types/domain';
import { useProductMutations } from '../../logic/productLogic';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ProductsStackParamList } from '../../navigation/types';
import { Save, Trash2, Tag, CircleDollarSign, Package, Info } from 'lucide-react-native';

// ─── Note: All colors now use theme tokens from useThemeTokens() ────────────────────────────────────────

const GST_RATES = ['0', '5', '12', '18', '28'];

// ─── Types ──────────────────────────────────────────────────────────────────
type ProductFormRoute = RouteProp<ProductsStackParamList, 'ProductForm'>;

type FormState = {
  name: string;
  sku: string;
  category: string;
  unit: string;
  selling_price: string;
  purchase_price: string;
  mrp: string;
  stock_quantity: string;
  taxRate: string;
  lowStockThreshold: string;
  barcode: string;
  description: string;
  expiry_date: string;
};

const DEFAULT_FORM: FormState = {
  name: '',
  sku: '',
  category: '',
  unit: '',
  selling_price: '',
  purchase_price: '',
  mrp: '',
  stock_quantity: '',
  taxRate: '18',
  lowStockThreshold: '10',
  barcode: '',
  description: '',
  expiry_date: '',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Section card with green left-accent bar header */
const Section = React.memo(function Section({
  title,
  icon,
  children,
  styles: s,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        <View style={s.sectionAccentBar} />
        <View style={s.sectionIconWrap}>{icon}</View>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
});

/** Labeled text input styled to Stitch spec */
const Field = React.memo(function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
  error,
  suffix,
  prefix,
  styles: s,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  suffix?: React.ReactNode;
  prefix?: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldInputWrap, !!error && s.fieldInputError]}>
        {prefix ? <Text style={s.fieldPrefix}>{prefix}</Text> : null}
        <TextInput
          style={[
            s.fieldInput,
            prefix ? s.fieldInputWithPrefix : undefined,
            multiline ? s.fieldInputMultiline : undefined,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={s.tokens.mutedForeground}
          keyboardType={keyboardType ?? 'default'}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {suffix ? <View style={s.fieldSuffix}>{suffix}</View> : null}
      </View>
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
});

// ─── Main Screen ────────────────────────────────────────────────────────────
const ProductFormScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const { organizationId } = useOrganization();
  const navigation = useNavigation<NativeStackNavigationProp<ProductsStackParamList>>();
  const route = useRoute<ProductFormRoute>();
  const mode = route.params?.mode ?? 'create';
  const product = route.params?.product;
  const { createProduct, updateProduct, deleteProduct } = useProductMutations();

  const [form, setForm] = React.useState<FormState>(() => ({
    name: product?.name ?? DEFAULT_FORM.name,
    sku: product?.sku ?? DEFAULT_FORM.sku,
    category:
      (typeof product?.category === 'object' && product?.category !== null
        ? product.category.name
        : product?.category) ?? DEFAULT_FORM.category,
    unit: product?.unit ?? DEFAULT_FORM.unit,
    selling_price: product?.selling_price ? String(product.selling_price) : DEFAULT_FORM.selling_price,
    purchase_price: product?.purchase_price ? String(product.purchase_price) : DEFAULT_FORM.purchase_price,
    mrp: product?.mrp ? String(product.mrp) : DEFAULT_FORM.mrp,
    stock_quantity:
      product?.stock_quantity != null ? String(product.stock_quantity) : DEFAULT_FORM.stock_quantity,
    taxRate: product?.tax_rate != null ? String(product.tax_rate) : DEFAULT_FORM.taxRate,
    lowStockThreshold:
      product?.low_stock_threshold != null
        ? String(product.low_stock_threshold)
        : DEFAULT_FORM.lowStockThreshold,
    barcode: product?.barcode ?? DEFAULT_FORM.barcode,
    description: product?.description ?? DEFAULT_FORM.description,
    expiry_date: product?.expiry_date ?? DEFAULT_FORM.expiry_date,
  }));

  const [isActive, setIsActive] = React.useState(product?.is_active ?? true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setSubmitting] = React.useState(false);

  const updateField = React.useCallback(
    (field: keyof FormState, value: string) => {
      setForm(prev => ({ ...prev, [field]: value }));
      setErrors(prev => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const validate = React.useCallback(() => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = 'Item name is required';
    if (!form.sku.trim()) nextErrors.sku = 'SKU is required';
    if (!form.unit.trim()) nextErrors.unit = 'Unit is required';

    if (!form.selling_price.trim()) {
      nextErrors.selling_price = 'Price is required';
    } else {
      const priceNum = Number(form.selling_price);
      if (Number.isNaN(priceNum)) nextErrors.selling_price = 'Enter a valid number';
      else if (priceNum < 0) nextErrors.selling_price = 'Price cannot be negative';
      else if (priceNum === 0) nextErrors.selling_price = 'Price must be greater than zero';
    }

    if (form.stock_quantity.trim()) {
      const stockNum = Number(form.stock_quantity);
      if (Number.isNaN(stockNum)) nextErrors.stock_quantity = 'Stock must be numeric';
      else if (stockNum < 0) nextErrors.stock_quantity = 'Stock cannot be negative';
      else if (!Number.isInteger(stockNum)) nextErrors.stock_quantity = 'Stock must be a whole number';
    }

    if (!form.taxRate.trim()) {
      nextErrors.taxRate = 'Tax rate is required';
    } else {
      const taxNum = Number(form.taxRate);
      if (Number.isNaN(taxNum)) nextErrors.taxRate = 'Tax rate must be numeric';
      else if (taxNum < 0 || taxNum > 100) nextErrors.taxRate = 'Tax rate must be 0–100';
    }

    if (!form.lowStockThreshold.trim()) {
      nextErrors.lowStockThreshold = 'Low stock threshold is required';
    } else {
      const thresholdNum = Number(form.lowStockThreshold);
      if (Number.isNaN(thresholdNum)) nextErrors.lowStockThreshold = 'Threshold must be numeric';
      else if (thresholdNum < 0) nextErrors.lowStockThreshold = 'Threshold cannot be negative';
      else if (!Number.isInteger(thresholdNum)) nextErrors.lowStockThreshold = 'Threshold must be a whole number';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form]);

  const handleSubmit = React.useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);

    const payload = {
      organization_id: organizationId!,
      name: form.name.trim(),
      sku: form.sku.trim(),
      category_id: null,
      selling_price: Number(form.selling_price),
      purchase_price: Number(form.purchase_price) || 0,
      mrp: Number(form.mrp) || 0,
      stock_quantity: form.stock_quantity.trim() ? Number(form.stock_quantity) : 0,
      unit: form.unit.trim() || 'qty',
      tax_rate: Number(form.taxRate),
      barcode: form.barcode.trim() || undefined,
      batch_id: undefined,
      description: form.description.trim() || undefined,
      is_active: isActive,
      expiry_date: form.expiry_date.trim() || undefined,
      image_url: undefined,
      low_stock_threshold: form.lowStockThreshold.trim()
        ? Number(form.lowStockThreshold)
        : undefined,
    } as Omit<Product, 'id' | 'created_at' | 'updated_at'>;

    try {
      if (mode === 'create') {
        await createProduct.mutateAsync(payload);
      } else if (product?.id) {
        await updateProduct.mutateAsync({ id: product.id, updates: payload });
      }
      Alert.alert('Success', 'Item saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: unknown) {
      const { logger } = await import('../../utils/logger');
      logger.error('[ProductForm] Save failed', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save product. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [validate, form, isActive, mode, product, createProduct, updateProduct, navigation]);

  const handleDelete = React.useCallback(() => {
    if (!product?.id) return;

    Alert.alert('Delete item', 'This will remove the item from active inventory. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmitting(true);
            await deleteProduct.mutateAsync(product.id);
            Alert.alert('Deleted', 'Item has been deleted.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch (err: unknown) {
            const { logger } = await import('../../utils/logger');
            logger.error('[ProductForm] Delete failed', err);
            const errorMessage =
              err instanceof Error ? err.message : 'Unable to delete item.';
            Alert.alert('Delete failed', errorMessage);
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }, [product, deleteProduct, navigation]);

  const headerTitle = mode === 'create' ? 'Add Item' : 'Edit Item';

  return (
    <View style={styles.screen}>
      <DetailHeader
        title={headerTitle}
        actions={[
          {
            icon: <Save size={18} color={tokens.primary} />,
            onPress: handleSubmit,
            accessibilityLabel: 'Save item',
          },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Section 1: Basic Info ── */}
          <Section
            title="BASIC INFO"
            icon={<Tag size={16} color={tokens.primary} />}
            styles={styles}
          >
            <Field
              label="ITEM NAME"
              value={form.name}
              onChangeText={v => updateField('name', v)}
              placeholder="e.g. Classic Leather Wallet"
              error={errors.name}
              styles={styles}
            />
            <Field
              label="SKU"
              value={form.sku}
              onChangeText={v => updateField('sku', v)}
              placeholder="e.g. CLW-001"
              error={errors.sku}
              styles={styles}
            />
            <Field
              label="BARCODE"
              value={form.barcode}
              onChangeText={v => updateField('barcode', v)}
              placeholder="Scan or enter manually"
              styles={styles}
            />
            <Field
              label="CATEGORY"
              value={form.category}
              onChangeText={v => updateField('category', v)}
              placeholder="e.g. Electronics, Dairy"
              styles={styles}
            />
            <Field
              label="UNIT"
              value={form.unit}
              onChangeText={v => updateField('unit', v)}
              placeholder="Piece / Box / Kg"
              error={errors.unit}
              styles={styles}
            />
          </Section>

          {/* ── Section 2: Pricing ── */}
          <Section
            title="PRICING"
            icon={<CircleDollarSign size={16} color={tokens.primary} />}
            styles={styles}
          >
            <View style={styles.pricingRow}>
              <View style={styles.pricingField}>
                <Field
                  label="MRP"
                  value={form.mrp}
                  onChangeText={v => updateField('mrp', v)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  prefix="₹"
                  styles={styles}
                />
              </View>
              <View style={styles.pricingField}>
                <Field
                  label="SELLING PRICE"
                  value={form.selling_price}
                  onChangeText={v => updateField('selling_price', v)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  prefix="₹"
                  error={errors.selling_price}
                  styles={styles}
                />
              </View>
            </View>
            <Field
              label="PURCHASE PRICE"
              value={form.purchase_price}
              onChangeText={v => updateField('purchase_price', v)}
              placeholder="0"
              keyboardType="decimal-pad"
              prefix="₹"
              styles={styles}
            />

            {/* GST Pill Selector */}
            <View style={styles.gstBlock}>
              <Text style={styles.fieldLabel}>GST RATE (%)</Text>
              <View style={styles.gstPills}>
                {GST_RATES.map(rate => {
                  const isSelected = form.taxRate === rate;
                  return (
                    <TouchableOpacity
                      key={rate}
                      onPress={() => updateField('taxRate', rate)}
                      activeOpacity={0.75}
                      style={[styles.gstPill, isSelected && styles.gstPillActive]}
                    >
                      <Text style={[styles.gstPillText, isSelected && styles.gstPillTextActive]}>
                        {rate}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!GST_RATES.includes(form.taxRate) && (
                <Field
                  label="CUSTOM GST RATE (%)"
                  value={form.taxRate}
                  onChangeText={v => updateField('taxRate', v)}
                  placeholder="e.g. 3"
                  keyboardType="decimal-pad"
                  error={errors.taxRate}
                  styles={styles}
                />
              )}
              {errors.taxRate ? <Text style={styles.fieldError}>{errors.taxRate}</Text> : null}
            </View>
          </Section>

          {/* ── Section 3: Inventory ── */}
          <Section
            title="INVENTORY"
            icon={<Package size={16} color={tokens.primary} />}
            styles={styles}
          >
            <View style={styles.pricingRow}>
              <View style={styles.pricingField}>
                <Field
                  label="OPENING STOCK"
                  value={form.stock_quantity}
                  onChangeText={v => updateField('stock_quantity', v)}
                  placeholder="0"
                  keyboardType="number-pad"
                  error={errors.stock_quantity}
                  styles={styles}
                />
              </View>
              <View style={styles.pricingField}>
                <Field
                  label="LOW STOCK ALERT"
                  value={form.lowStockThreshold}
                  onChangeText={v => updateField('lowStockThreshold', v)}
                  placeholder="10"
                  keyboardType="number-pad"
                  error={errors.lowStockThreshold}
                  styles={styles}
                />
              </View>
            </View>
          </Section>

          {/* ── Section 4: Additional Details ── */}
          <Section
            title="ADDITIONAL DETAILS"
            icon={<Info size={16} color={tokens.primary} />}
            styles={styles}
          >
            <Field
              label="EXPIRY DATE (YYYY-MM-DD)"
              value={form.expiry_date}
              onChangeText={v => updateField('expiry_date', v)}
              placeholder="2025-12-31"
              styles={styles}
            />
            <Field
              label="DESCRIPTION"
              value={form.description}
              onChangeText={v => updateField('description', v)}
              placeholder="Storage tips, vendor notes…"
              multiline
              numberOfLines={4}
              styles={styles}
            />

            {/* Active toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Item Active</Text>
                <Text style={styles.toggleSubtext}>
                  {isActive ? 'Visible in catalog & POS' : 'Hidden from catalog & POS'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                thumbColor={tokens.primaryForeground}
                trackColor={{ false: tokens.muted, true: tokens.primary }}
              />
            </View>
          </Section>

          {/* ── Footer: CTA + Archive ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Save size={16} color={tokens.primaryForeground} />
              <Text style={styles.saveBtnText}>
                {isSubmitting ? 'Saving…' : mode === 'create' ? 'Save Item' : 'Update Item'}
              </Text>
            </TouchableOpacity>

            {mode === 'edit' && product?.id && (
              <TouchableOpacity
                style={styles.archiveBtn}
                onPress={handleDelete}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color={tokens.destructive} />
                <Text style={styles.archiveBtnText}>Delete Item</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const createStyles = (tokens: ThemeTokens) => {
  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    flex: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 48,
      gap: 16,
    },

    // ── Section Card ──
    sectionCard: {
      backgroundColor: tokens.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    sectionAccentBar: {
      width: 3,
      height: 20,
      borderRadius: 4,
      backgroundColor: tokens.primary,
    },
    sectionIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: tokens.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.mutedForeground,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    sectionBody: {
      padding: 20,
      gap: 14,
    },

    // ── Field ──
    field: {
      gap: 6,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.mutedForeground,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    fieldInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.muted,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    fieldInputError: {
      borderColor: tokens.destructive,
    },
    fieldPrefix: {
      paddingLeft: 14,
      fontSize: 15,
      fontWeight: '600',
      color: tokens.mutedForeground,
    },
    fieldInput: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      fontWeight: '600',
      color: tokens.foreground,
    },
    fieldInputWithPrefix: {
      paddingLeft: 4,
    },
    fieldInputMultiline: {
      height: 100,
      paddingTop: 12,
    },
    fieldSuffix: {
      paddingRight: 12,
    },
    fieldError: {
      fontSize: 11,
      color: tokens.destructive,
      fontWeight: '600',
    },

    // ── Pricing row (2 cols) ──
    pricingRow: {
      flexDirection: 'row',
      gap: 12,
    },
    pricingField: {
      flex: 1,
    },

    // ── GST pills ──
    gstBlock: {
      gap: 8,
    },
    gstPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    gstPill: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: tokens.muted,
    },
    gstPillActive: {
      backgroundColor: tokens.primary,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    gstPillText: {
      fontSize: 13,
      fontWeight: '700',
      color: tokens.mutedForeground,
    },
    gstPillTextActive: {
      color: tokens.primaryForeground,
    },

    // ── Active toggle ──
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tokens.secondary,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
    },
    toggleTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: tokens.foreground,
    },
    toggleSubtext: {
      fontSize: 11,
      color: tokens.mutedForeground,
      marginTop: 2,
    },

    // ── Footer ──
    footer: {
      gap: 12,
      marginTop: 4,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: tokens.primary,
      paddingVertical: 16,
      borderRadius: 16,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    saveBtnDisabled: {
      opacity: 0.6,
    },
    saveBtnText: {
      color: tokens.primaryForeground,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    archiveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: 'transparent',
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: tokens.destructive + '30',
    },
    archiveBtnText: {
      color: tokens.destructive,
      fontSize: 14,
      fontWeight: '700',
    },
  });
  return { ...styles, tokens };
};

export default ProductFormScreen;
