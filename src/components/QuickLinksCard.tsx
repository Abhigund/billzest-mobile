import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';

export type QuickLinkItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onPress?: () => void;
};

type QuickLinksCardProps = {
  items: QuickLinkItem[];
  title?: string;
  showAllLabel?: string;
  onShowAll?: () => void;
  maxVisibleItems?: number;
};

const QuickLinksCard: React.FC<QuickLinksCardProps> = ({
  items,
  title = 'Quick Links',
  showAllLabel = 'Show All',
  onShowAll,
  maxVisibleItems,
}) => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [isExpanded, setExpanded] = React.useState(false);

  const cappedCount =
    typeof maxVisibleItems === 'number' && maxVisibleItems > 0
      ? maxVisibleItems
      : undefined;
  const hiddenCount = cappedCount ? Math.max(items.length - cappedCount, 0) : 0;
  const visibleItems =
    cappedCount && !isExpanded ? items.slice(0, cappedCount) : items;
  const showOverflowLink = hiddenCount > 0 && !isExpanded;
  const showHeaderLink = Boolean(onShowAll) || showOverflowLink;

  const handleShowAll = () => {
    if (onShowAll) {
      onShowAll();
      return;
    }
    setExpanded(true);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showHeaderLink ? (
          <Pressable onPress={handleShowAll}>
            <Text style={styles.link}>
              {showOverflowLink ? `${showAllLabel} (${hiddenCount})` : showAllLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.grid}>
        {visibleItems.map(item => (
          <Pressable key={item.id} style={styles.item} onPress={item.onPress}>
            <View style={styles.iconContainer}>{item.icon}</View>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: tokens.card,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    title: {
      color: tokens.foreground,
      fontWeight: '700',
      fontSize: 14,
    },
    link: {
      color: tokens.primary,
      fontWeight: '600',
      fontSize: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    item: {
      width: '23%',
      marginBottom: 10,
      alignItems: 'center',
      backgroundColor: tokens.card,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.background,
      marginBottom: 6,
    },
    itemLabel: {
      color: tokens.foreground,
      fontWeight: '600',
      fontSize: 12,
      textAlign: 'center',
    },
  });

export default QuickLinksCard;
