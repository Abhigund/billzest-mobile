import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductsStackParamList } from '../../navigation/types';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { useCategories, useCategoryMutations } from '../../logic/categoryLogic';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import FAB from '../../components/ui/FAB';
import { Badge } from '../../components/ui/Badge';
import EmptyState from '../../components/EmptyState';
import { Package, AlertTriangle, Edit, Trash2, Tag, EyeOff } from 'lucide-react-native';
import { Category } from '../../types/domain';

const CategoriesListScreen = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NativeStackNavigationProp<ProductsStackParamList>>();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: categories = [], isLoading, isRefetching, refetch, error } = useCategories();
  const { deleteCategory, updateCategory } = useCategoryMutations();

  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const toggleCategoryStatus = async (category: Category) => {
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        updates: { is_active: !category.is_active },
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to toggle status.');
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory.mutateAsync(category.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={tokens.primary}
            />
          }
        >
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search categories..."
          />

          <View style={styles.list}>
            {isLoading && !isRefetching && (
              <ActivityIndicator
                size="large"
                color={tokens.primary}
                style={{ marginTop: 20 }}
              />
            )}

            {!isLoading && error && (
              <EmptyState
                icon={<AlertTriangle color={tokens.destructive} size={32} />}
                title="Unable to load categories"
                description="Check your connection and retry."
                actionLabel="Try Again"
                onAction={refetch}
              />
            )}

            {!isLoading && !error && filteredCategories.length === 0 && (
              <EmptyState
                icon={<Tag color={tokens.primary} size={32} />}
                title="No categories found"
                description="Try adjusting your search or add a new category."
                actionLabel="Add Category"
                onAction={() => navigation.navigate('CategoryFormSheet', {})}
              />
            )}

            {!error &&
              filteredCategories.map(category => (
                <View key={category.id} style={styles.categoryCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.iconText}>{category.icon || '📦'}</Text>
                    </View>
                    <View style={styles.titleContainer}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <View style={styles.badgesRow}>
                         {/* Fallback to 0 if product count missing in summary */}
                        <Badge variant="secondary" textStyle={{ fontSize: 9 }}>
                          {0} products
                        </Badge>
                        <Badge variant={category.is_active ? 'success' : 'outline'} textStyle={{ fontSize: 9 }}>
                          {category.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.gstText}>
                      GST: <Text style={{ fontWeight: '700' }}>{category.gst_rate || 0}%</Text>
                    </Text>
                    <View style={styles.actions}>
                       <Pressable
                        style={styles.actionBtn}
                        onPress={() => toggleCategoryStatus(category)}
                      >
                        <EyeOff color={tokens.mutedForeground} size={18} />
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() =>
                          navigation.navigate('CategoryFormSheet', {
                            categoryId: category.id,
                            category,
                          })
                        }
                      >
                        <Edit color={tokens.primary} size={18} />
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => confirmDeleteCategory(category)}
                      >
                        <Trash2 color={tokens.destructive} size={18} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <FAB
          label="Add Category"
          onPress={() => navigation.navigate('CategoryFormSheet', {})}
          accessibilityLabel="Add new category"
        />
      </View>
    </ScreenWrapper>
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
    list: {
      marginTop: 8,
    },
    categoryCard: {
      backgroundColor: tokens.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    iconText: {
      fontSize: 24,
    },
    titleContainer: {
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
      marginBottom: 6,
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      paddingTop: 12,
      marginTop: 4,
    },
    gstText: {
      fontSize: 12,
      color: tokens.mutedForeground,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: tokens.background,
      borderWidth: 1,
      borderColor: tokens.border,
    },
  });

export default CategoriesListScreen;
