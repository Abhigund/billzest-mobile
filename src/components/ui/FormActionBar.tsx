import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

// ─── Dual-button variant props ──────────────────────────────────────────────
export interface FormActionBarDualProps {
  variant: 'dual';
  /** Left ghost/text button */
  secondaryLabel: string;
  secondaryIcon?: React.ReactNode;
  onSecondary: () => void;
  /** 'muted' (default) | 'accent' — accent gives the button a primary-tinted bg | 'destructive' — red-tinted bg for delete actions */
  secondaryVariant?: 'muted' | 'accent' | 'destructive';
  /** Right primary button */
  primaryLabel: string;
  primaryIcon?: React.ReactNode;
  onPrimary: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Use destructive color for primary (e.g. delete-confirm) */
  primaryDestructive?: boolean;
}

// ─── Summary + action variant props ─────────────────────────────────────────
export interface FormActionBarSummaryProps {
  variant: 'summary';
  /** e.g. "3 items" */
  itemsLabel: string;
  /** e.g. "₹1,200" */
  amountLabel: string;
  /** Right primary CTA */
  primaryLabel: string;
  primaryIcon?: React.ReactNode;
  onPrimary: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export type FormActionBarProps = FormActionBarDualProps | FormActionBarSummaryProps;

const FormActionBar: React.FC<FormActionBarProps> = (props) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  if (props.variant === 'summary') {
    const { itemsLabel, amountLabel, primaryLabel, primaryIcon, onPrimary, loading, disabled } = props;
    return (
      <View style={styles.bar}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryItemsText}>{itemsLabel}</Text>
          <Text style={styles.summaryAmountText}>{amountLabel}</Text>
        </View>
        <Pressable
          style={[styles.primaryBtn, (disabled || loading) && styles.btnDisabled]}
          onPress={onPrimary}
          disabled={disabled || loading}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
        >
          {loading ? (
            <ActivityIndicator size="small" color={tokens.primaryForeground} />
          ) : (
            <>
              {primaryIcon && <View style={styles.iconSlot}>{primaryIcon}</View>}
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }

  const {
    secondaryLabel,
    secondaryIcon,
    onSecondary,
    secondaryVariant = 'muted',
    primaryLabel,
    primaryIcon,
    onPrimary,
    loading,
    disabled,
    primaryDestructive,
  } = props;

  return (
    <View style={styles.bar}>
      <Pressable
        style={[
          styles.secondaryBtn,
          secondaryVariant === 'accent' && styles.secondaryBtnAccent,
          secondaryVariant === 'destructive' && styles.secondaryBtnDestructive,
        ]}
        onPress={onSecondary}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={secondaryLabel}
      >
        {secondaryIcon && <View style={styles.iconSlot}>{secondaryIcon}</View>}
        <Text style={[
          styles.secondaryBtnText,
          secondaryVariant === 'accent' && styles.secondaryBtnTextAccent,
          secondaryVariant === 'destructive' && styles.secondaryBtnTextDestructive,
        ]}>{secondaryLabel}</Text>
      </Pressable>

      <Pressable
        style={[
          styles.primaryBtn,
          styles.primaryBtnFlex,
          primaryDestructive && { backgroundColor: tokens.destructive, shadowColor: tokens.destructive },
          (disabled || loading) && styles.btnDisabled,
        ]}
        onPress={onPrimary}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
      >
        {loading ? (
          <ActivityIndicator size="small" color={tokens.primaryForeground} />
        ) : (
          <>
            {primaryIcon && <View style={styles.iconSlot}>{primaryIcon}</View>}
            <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacingSm, // 8px
      paddingHorizontal: tokens.spacingLg, // 16px
      paddingTop: tokens.spacingSm, // 8px
      paddingBottom: Platform.OS === 'ios' ? tokens.spacingXxl + tokens.spacingSm : tokens.spacingLg, // 40px iOS, 16px Android (minimum 24px)
      backgroundColor: tokens.card,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 8,
    },

    // ── Secondary (ghost) button ──
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacingXs, // 4px
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: tokens.spacingSm, // 8px
      borderRadius: tokens.radiusSm, // 8px
      backgroundColor: tokens.muted,
      minWidth: 88,
    },
    secondaryBtnAccent: {
      backgroundColor: tokens.primaryAlpha15,
    },
    secondaryBtnDestructive: {
      backgroundColor: tokens.destructiveAlpha10,
    },
    secondaryBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.mutedForeground,
    },
    secondaryBtnTextAccent: {
      color: tokens.primary,
    },
    secondaryBtnTextDestructive: {
      color: tokens.destructive,
    },

    // ── Primary button ──
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacingXs, // 4px
      paddingHorizontal: tokens.spacingLg, // 16px
      paddingVertical: tokens.spacingSm, // 8px
      borderRadius: tokens.radiusSm, // 8px
      backgroundColor: tokens.primary,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 5,
    },
    primaryBtnFlex: {
      flex: 1,
    },
    primaryBtnText: {
      fontSize: 15, // Primary size
      fontWeight: '700', // Bold for emphasis
      color: tokens.primaryForeground,
    },

    // ── Summary left side ──
    summaryLeft: {
      flex: 1,
      justifyContent: 'center',
    },
    summaryItemsText: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    summaryAmountText: {
      fontSize: 20,
      fontWeight: '800',
      color: tokens.primary,
      marginTop: 1,
    },

    iconSlot: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnDisabled: {
      opacity: 0.5,
    },
  });

export default FormActionBar;
