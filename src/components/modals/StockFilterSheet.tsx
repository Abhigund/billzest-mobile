import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import ActionSheet from './ActionSheet';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

const STATUS_OPTIONS = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

type StockFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { status: string | null }) => void;
  currentStatus?: string | null;
};

const StockFilterSheet: React.FC<StockFilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  currentStatus = null,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus ?? 'All');

  const handleApply = () => {
    onApply({ status: selectedStatus === 'All' ? null : selectedStatus });
    onClose();
  };

  const handleClear = () => {
    setSelectedStatus('All');
    onApply({ status: null });
    onClose();
  };

  return (
    <ActionSheet visible={visible} onClose={onClose} title="Filter By">
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Stock Status</Text>
        {STATUS_OPTIONS.map(status => {
          const isSelected = selectedStatus === status;
          return (
            <Pressable
              key={status}
              style={[styles.option, isSelected && styles.optionActive]}
              onPress={() => setSelectedStatus(status)}
              accessibilityLabel={`Filter by ${status}`}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                {status}
              </Text>
              {isSelected && <View style={styles.dot} />}
            </Pressable>
          );
        })}

        <View style={styles.footer}>
          <Pressable style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </ActionSheet>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 10,
      marginBottom: 6,
      backgroundColor: 'transparent',
    },
    optionActive: {
      backgroundColor: tokens.primaryAlpha15,
    },
    optionText: {
      fontSize: 15,
      color: tokens.foreground,
      fontWeight: '500',
    },
    optionTextActive: {
      color: tokens.primary,
      fontWeight: '700',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: tokens.primary,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    clearBtn: {
      flex: 1,
      padding: 14,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: tokens.background,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    applyBtn: {
      flex: 1,
      padding: 14,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: tokens.primary,
    },
    clearText: {
      fontWeight: '600',
      color: tokens.mutedForeground,
    },
    applyText: {
      fontWeight: '600',
      color: tokens.primaryForeground,
    },
  });

export default StockFilterSheet;
