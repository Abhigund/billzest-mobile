import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';
import { Search, Filter } from 'lucide-react-native';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  showFilter?: boolean;
  filterActive?: boolean;
  trailingActions?: React.ReactNode;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFilterPress,
  showFilter = false,
  filterActive = false,
  trailingActions,
  autoFocus,
  style,
}) => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens, !!trailingActions), [tokens, trailingActions]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchBarContainer}>
        <Search color={tokens.mutedForeground} size={18} />
        <TextInput
          value={value}
          autoFocus={autoFocus}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.mutedForeground}
          style={styles.searchInput}
        />
        {showFilter && onFilterPress && (
          <>
            <View style={styles.inlineDivider} />
            <Pressable
              style={[
                styles.inlineIconButton,
                filterActive && styles.inlineIconButtonActive,
              ]}
              onPress={onFilterPress}
              accessibilityLabel="Open filters"
            >
              <Filter 
                color={tokens.primary} 
                size={16} 
              />
            </Pressable>
          </>
        )}
      </View>
      {trailingActions && (
        <View style={styles.trailingActionsContainer}>
          {trailingActions}
        </View>
      )}
    </View>
  );
};

const createStyles = (tokens: ThemeTokens, hasTrailingActions: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    searchBarContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: hasTrailingActions ? 10 : 0,
    },
    searchInput: {
      flex: 1,
      marginHorizontal: 10,
      paddingVertical: 2,
      color: tokens.foreground,
      fontSize: 15,
    },
    inlineDivider: {
      width: 1,
      height: 22,
      backgroundColor: tokens.border,
      marginHorizontal: 8,
    },
    inlineIconButton: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.secondary,
    },
    inlineIconButtonActive: {
      backgroundColor: tokens.card,
      borderWidth: 1,
      borderColor: tokens.primary,
    },
    trailingActionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
  });

export default SearchBar;
