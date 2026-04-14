import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { useCategoryMutations } from '../../logic/categoryLogic';
import { Category } from '../../types/domain';
import { ProductsStackParamList } from '../../navigation/types';
import { X, Save, Tag } from 'lucide-react-native';

const CategoryFormSheet = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NativeStackNavigationProp<ProductsStackParamList>>();
  const route = useRoute<RouteProp<ProductsStackParamList, 'CategoryFormSheet'>>();

  const existingCategory: Category | undefined = route.params?.category;
  const isEditMode = !!existingCategory;

  const [name, setName] = useState(existingCategory?.name || '');
  const [icon, setIcon] = useState(existingCategory?.icon || '📦');
  const [gstRate, setGstRate] = useState(
    existingCategory?.gst_rate?.toString() || '0'
  );
  
  const { createCategory, updateCategory } = useCategoryMutations();
  const isSaving = createCategory.isPending || updateCategory.isPending;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Category name is required.');
      return;
    }

    const rate = parseFloat(gstRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      Alert.alert('Validation Error', 'Please enter a valid GST rate between 0 and 100.');
      return;
    }

    try {
      if (isEditMode && existingCategory) {
        await updateCategory.mutateAsync({
          id: existingCategory.id,
          updates: {
            name: name.trim(),
            icon: icon.trim() || '📦',
            gst_rate: rate,
          },
        });
      } else {
        await createCategory.mutateAsync({
          name: name.trim(),
          icon: icon.trim() || '📦',
          gst_rate: rate,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save category');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Tag color={tokens.foreground} size={20} />
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Category' : 'New Category'}
          </Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X color={tokens.foreground} size={24} />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Electronics"
            placeholderTextColor={tokens.mutedForeground}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emoji Icon</Text>
          <TextInput
            style={styles.input}
            value={icon}
            onChangeText={setIcon}
            placeholder="📦"
            placeholderTextColor={tokens.mutedForeground}
            maxLength={2} // Simple emoji input
          />
          <Text style={styles.helperText}>Used as a visual identifier in lists.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Default GST Rate (%)</Text>
          <TextInput
            style={styles.input}
            value={gstRate}
            onChangeText={setGstRate}
            placeholder="18"
            placeholderTextColor={tokens.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Save color={tokens.primaryForeground} size={20} style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>
            {isSaving ? 'Saving...' : 'Save Category'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.background,
      marginTop: Platform.OS === 'ios' ? 44 : 0, // Mock modal offset
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      backgroundColor: tokens.card,
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: tokens.foreground,
    },
    closeBtn: {
      padding: 4,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.foreground,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: tokens.foreground,
      backgroundColor: tokens.card,
    },
    helperText: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 6,
    },
    footer: {
      flexDirection: 'row',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      backgroundColor: tokens.card,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    cancelBtn: {
      flex: 1,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      marginRight: 12,
    },
    cancelBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.foreground,
    },
    saveBtn: {
      flex: 2,
      flexDirection: 'row',
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: tokens.primary,
    },
    saveBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.primaryForeground,
    },
  });

export default CategoryFormSheet;
