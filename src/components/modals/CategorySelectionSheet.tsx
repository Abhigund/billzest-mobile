import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import ActionSheet from './ActionSheet';
import SearchBar from '../SearchBar';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { Category } from '../../types/domain';
import { useCategories } from '../../logic/categoryLogic';
import { Tag, Plus, Check } from 'lucide-react-native';

type CategorySelectionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: Category | null) => void;
  selectedCategoryId?: string | null;
  onAddNew?: () => void;
};

const CategorySelectionSheet: React.FC<CategorySelectionSheetProps> = ({
  visible,
  onClose,
  onSelect,
  selectedCategoryId,
  onAddNew,
}) => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const { data: categories = [], isLoading } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleSelect = (category: Category | null) => {
    onSelect(category);
    onClose();
  };

  const renderItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategoryId === item.id;

    return (
      <Pressable
        style={[styles.itemRow, isSelected && styles.itemRowSelected]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{item.icon || '📦'}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
            {item.name}
          </Text>
          {item.gst_rate !== null && (
            <Text style={styles.itemMeta}>GST: {item.gst_rate}%</Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.checkCircle}>
            <Check color={tokens.primaryForeground} size={14} strokeWidth={3} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title="Select Category"
      subtitle="Organize your products with categories"
      scrollable={false}
    >
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search categories..."
          />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={tokens.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredCategories}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Pressable
                style={[styles.itemRow, !selectedCategoryId && styles.itemRowSelected]}
                onPress={() => handleSelect(null)}
              >
                <View style={[styles.iconContainer, { backgroundColor: tokens.muted }]}>
                  <Tag color={tokens.mutedForeground} size={20} />
                </View>
                <Text style={[styles.itemName, !selectedCategoryId && styles.itemNameSelected]}>
                  No Category
                </Text>
                {!selectedCategoryId && (
                  <View style={styles.checkCircle}>
                    <Check color={tokens.primaryForeground} size={14} strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchTerm ? 'No categories found' : 'No categories yet'}
                </Text>
              </View>
            }
          />
        )}

        {onAddNew && (
          <Pressable style={styles.addNewButton} onPress={onAddNew}>
            <View style={styles.addIconWrap}>
              <Plus color={tokens.primary} size={20} strokeWidth={3} />
            </View>
            <Text style={styles.addNewText}>Create New Category</Text>
          </Pressable>
        )}
      </View>
    </ActionSheet>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      minHeight: 400,
      maxHeight: 500,
    },
    searchContainer: {
      paddingBottom: 12,
    },
    listContent: {
      paddingBottom: 24,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 16,
      marginBottom: 4,
      gap: 12,
    },
    itemRowSelected: {
      backgroundColor: tokens.primaryAlpha10,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: tokens.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: 22,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: 15,
      fontWeight: '600',
      color: tokens.foreground,
    },
    itemNameSelected: {
      color: tokens.primary,
      fontWeight: '700',
    },
    itemMeta: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 2,
    },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: tokens.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      color: tokens.mutedForeground,
      fontSize: 14,
    },
    addNewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 16,
      backgroundColor: tokens.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      marginTop: 8,
    },
    addIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: tokens.primaryAlpha15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addNewText: {
      color: tokens.primary,
      fontSize: 14,
      fontWeight: '700',
    },
  });

export default CategorySelectionSheet;
