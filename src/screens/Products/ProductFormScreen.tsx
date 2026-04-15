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
import { Save, Check, Trash2, Tag, CircleDollarSign, Package, Info, ChevronRight, CheckCircle2, X, CalendarDays } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import FormActionBar from '../../components/ui/FormActionBar';
import { useCategories } from '../../logic/categoryLogic';
import CategorySelectionSheet from '../../components/modals/CategorySelectionSheet';

// ─── Note: All colors now use theme tokens from useThemeTokens() ────────────────────────────────────────

const GST_RATES = ['0', '5', '12', '18', '28'];

// ─── Types ──────────────────────────────────────────────────────────────────
type ProductFormRoute = RouteProp<ProductsStackParamList, 'ProductForm'>;

type FormState = {
  name: string;
  sku: string;
  category_id: string | null;
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
  category_id: null,
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
  onBlur,
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
  onBlur?: () => void;
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
          onBlur={onBlur}
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

/** Labeled select field (pressable) styled to Stitch spec */
const SelectField = React.memo(function SelectField({
  label,
  value,
  onPress,
  placeholder,
  error,
  icon,
  styles: s,
}: {
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[s.fieldInputWrap, !!error && s.fieldInputError, { paddingVertical: 13, paddingHorizontal: 14 }]}
      >
        <Text
          style={[
            s.fieldInput,
            { paddingHorizontal: 0, paddingVertical: 0 },
            !value ? { color: s.tokens.mutedForeground } : undefined,
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <View style={s.fieldSuffix}>
          {icon || <ChevronRight size={18} color={s.tokens.mutedForeground} />}
        </View>
      </TouchableOpacity>
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
    category_id: product?.category_id ?? DEFAULT_FORM.category_id,
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
  const [categorySheetVisible, setCategorySheetVisible] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const { data: categories = [] } = useCategories();

  const selectedCategoryName = React.useMemo(() => {
    if (!form.category_id) return '';
    const cat = categories.find(c => c.id === form.category_id);
    return cat?.name ?? '';
  }, [form.category_id, categories]);

  const updateField = React.useCallback(
    (field: keyof FormState, value: any) => {
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

  const expiryDateValue = React.useMemo(() => {
    if (!form.expiry_date.trim()) return new Date();
    const d = new Date(form.expiry_date);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [form.expiry_date]);

  const handleExpiryDateChange = React.useCallback((_: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      const iso = selected.toISOString().split('T')[0];
      updateField('expiry_date', iso);
    }
  }, [updateField]);

  const handleNameBlur = React.useCallback(() => {
    const titled = form.name
      .trim()
      .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    if (titled !== form.name) updateField('name', titled);
  }, [form.name, updateField]);

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
      category_id: form.category_id,
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
  }, [validate, form, isActive, mode, product, createProduct, updateProduct, navigation, organizationId]);

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
            icon: <Check size={18} color={tokens.primary} />,
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
              onBlur={handleNameBlur}
              placeholder="e.g. Classic Leather Wallet"
              error={errors.name}
              styles={styles}
            />

            {/* Item Active toggle — placed here so critical status is immediately visible */}
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
            <Field
              label="SKU"
              value={form.sku}
              onChangeText={v => updateField('sku', v)}
              placeholder="e.g. CLW-001"
              error={errors.sku}
              styles={styles}
            />
            <View style={styles.pricingRow}>
              <View style={styles.pricingField}>
                <Field
                  label="BARCODE"
                  value={form.barcode}
                  onChangeText={v => updateField('barcode', v)}
                  placeholder="Scan or enter"
                  styles={styles}
                />
              </View>
              <View style={styles.pricingField}>
                <Field
                  label="UNIT"
                  value={form.unit}
                  onChangeText={v => updateField('unit', v)}
                  placeholder="Pc / Box / Kg"
                  error={errors.unit}
                  styles={styles}
                />
              </View>
            </View>
            <SelectField
              label="CATEGORY"
              value={selectedCategoryName}
              onPress={() => setCategorySheetVisible(true)}
              placeholder="Select category"
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
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>EXPIRY DATE</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.fieldInputWrap,
                  { paddingVertical: 13, paddingHorizontal: 14 },
                  !form.expiry_date && styles.datePickerEmpty,
                ]}
              >
                <CalendarDays
                  size={16}
                  color={form.expiry_date ? styles.tokens.mutedForeground : styles.tokens.primary}
                />
                <Text
                  style={[
                    styles.fieldInput,
                    { paddingHorizontal: 10, paddingVertical: 0 },
                    !form.expiry_date
                      ? { color: styles.tokens.primary, fontWeight: '600' }
                      : undefined,
                  ]}
                >
                  {form.expiry_date || 'Select Date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={expiryDateValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleExpiryDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
            <Field
              label="DESCRIPTION"
              value={form.description}
              onChangeText={v => updateField('description', v)}
              placeholder="Storage tips, vendor notes…"
              multiline
              numberOfLines={4}
              styles={styles}
            />

          </Section>

        </ScrollView>
      </KeyboardAvoidingView>

      <FormActionBar
        variant="dual"
        secondaryLabel={mode === 'edit' && product?.id ? 'Delete' : 'Cancel'}
        secondaryIcon={
          mode === 'edit' && product?.id
            ? <Trash2 size={16} color={tokens.destructive} />
            : <X size={16} color={tokens.mutedForeground} />
        }
        secondaryVariant={mode === 'edit' && product?.id ? 'destructive' : 'muted'}
        onSecondary={mode === 'edit' && product?.id ? handleDelete : () => navigation.goBack()}
        primaryLabel={isSubmitting ? 'Saving…' : mode === 'create' ? 'Save Item' : 'Update Item'}
        primaryIcon={<CheckCircle2 size={16} color={tokens.primaryForeground} />}
        onPrimary={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
      />

      <CategorySelectionSheet
        visible={categorySheetVisible}
        onClose={() => setCategorySheetVisible(false)}
        selectedCategoryId={form.category_id}
        onSelect={cat => updateField('category_id', cat?.id ?? null)}
        onAddNew={() => {
          setCategorySheetVisible(false);
          navigation.navigate('CategoryFormSheet', {});
        }}
      />
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
      paddingBottom: 16,
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
      backgroundColor: tokens.primaryAlpha20,
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
      fontSize: 11,
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
    datePickerEmpty: {
      backgroundColor: tokens.primaryAlpha15,
      borderColor: tokens.primary,
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

  });
  return { ...styles, tokens };
};

export default ProductFormScreen;
