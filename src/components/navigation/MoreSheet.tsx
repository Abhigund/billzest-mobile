import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { Package, ShoppingBag, CreditCard, ChevronRight, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MoreTarget = 'Products' | 'Purchases' | 'Expenses';

interface MoreSheetProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (target: MoreTarget) => void;
}

const ITEMS: { key: MoreTarget; label: string; subtitle: string; Icon: any }[] = [
  {
    key: 'Products',
    label: 'Products',
    subtitle: 'Manage inventory & catalog',
    Icon: Package,
  },
  {
    key: 'Purchases',
    label: 'Purchases',
    subtitle: 'Track supplier orders',
    Icon: ShoppingBag,
  },
  {
    key: 'Expenses',
    label: 'Expenses',
    subtitle: 'Log business expenses',
    Icon: CreditCard,
  },
];

const MoreSheet: React.FC<MoreSheetProps> = ({ visible, onClose, onNavigate }) => {
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(tokens, insets.bottom), [tokens, insets.bottom]);

  const handleItem = (target: MoreTarget) => {
    onNavigate(target);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>More</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close more sheet"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={tokens.mutedForeground} />
            </Pressable>
          </View>

          {/* Items */}
          <View style={styles.itemsContainer}>
            {ITEMS.map((item, index) => {
              const Icon = item.Icon;
              return (
                <Pressable
                  key={item.key}
                  style={[
                    styles.item,
                    index < ITEMS.length - 1 && styles.itemBorder,
                  ]}
                  onPress={() => handleItem(item.key)}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <View style={styles.itemIconWrap}>
                    <Icon size={20} color={tokens.primaryForeground} />
                  </View>
                  <View style={styles.itemText}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={18} color={tokens.mutedForeground} />
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const createStyles = (tokens: ThemeTokens, bottomInset: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: tokens.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Math.max(bottomInset, 16),
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 16,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.border,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: tokens.foreground,
    },
    closeBtn: {
      padding: 4,
    },
    itemsContainer: {
      marginHorizontal: 16,
      backgroundColor: tokens.card,
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 8,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    itemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    itemIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: tokens.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    itemText: {
      flex: 1,
    },
    itemLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: tokens.foreground,
    },
    itemSubtitle: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 2,
    },
  });

export default MoreSheet;
export type { MoreTarget };
