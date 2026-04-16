import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ViewStyle,
} from 'react-native';
import { ChevronRight, Sun, Moon, Monitor } from 'lucide-react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

// ─── SettingsSectionCard ────────────────────────────────────────────────────

interface SettingsSectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SettingsSectionCard: React.FC<SettingsSectionCardProps> = ({
  title,
  subtitle,
  children,
  style,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardLabelRow}>
        <Text style={styles.cardLabel}>{title}</Text>
        {subtitle ? (
          <Text style={styles.cardLabelSub}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
};

// ─── SettingsRow ────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: React.ReactNode;
  iconTint?: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightElement?: React.ReactNode;
  accessibilityLabel?: string;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  iconTint,
  label,
  subtitle,
  onPress,
  isLast = false,
  rightElement,
  accessibilityLabel,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <View
        style={[
          styles.rowIconWrap,
          iconTint
            ? { backgroundColor: iconTint }
            : { backgroundColor: tokens.surface_container_low },
        ]}
      >
        {icon}
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement !== undefined ? (
        rightElement
      ) : (
        <ChevronRight color={tokens.mutedForeground} size={17} />
      )}
    </Pressable>
  );
};

// ─── PreferenceSwitchRow ────────────────────────────────────────────────────

interface PreferenceSwitchRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  isLast?: boolean;
  accessibilityLabel?: string;
}

export const PreferenceSwitchRow: React.FC<PreferenceSwitchRowProps> = ({
  icon,
  label,
  subtitle,
  value,
  onValueChange,
  isLast = false,
  accessibilityLabel,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={styles.rowIconWrap}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? (
          <Text style={styles.rowSub}>{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: tokens.surface_container_low,
          true: `${tokens.primary}99`,
        }}
        thumbColor={value ? tokens.primary : tokens.mutedForeground}
        accessibilityLabel={accessibilityLabel || label}
      />
    </View>
  );
};

// ─── SegmentedThemeSelector ─────────────────────────────────────────────────

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; Icon: typeof Sun }> = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

interface SegmentedThemeSelectorProps {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export const SegmentedThemeSelector: React.FC<SegmentedThemeSelectorProps> = ({
  value,
  onChange,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.themeTrack}>
      {THEME_OPTIONS.map(({ value: optValue, label, Icon }) => {
        const isActive = value === optValue;
        return (
          <Pressable
            key={optValue}
            onPress={() => onChange(optValue)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${label} theme`}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            style={[styles.themePill, isActive && styles.themePillActive]}
          >
            <Icon
              size={13}
              color={isActive ? tokens.primary : tokens.mutedForeground}
            />
            <Text
              style={[
                styles.themePillLabel,
                isActive && styles.themePillLabelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// ─── AccountCard ────────────────────────────────────────────────────────────

interface AccountCardProps {
  email?: string;
  userId?: string;
  children?: React.ReactNode;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  email,
  userId,
  children,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  const initials = email
    ? email.substring(0, 2).toUpperCase()
    : '??';

  const shortId = userId
    ? `UID · ${userId.substring(0, 8)}…`
    : 'Unavailable';

  return (
    <View style={styles.accountCard}>
      <View style={styles.avatarRing}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </View>
      <View style={styles.accountCopy}>
        <Text style={styles.accountEmail} numberOfLines={1}>
          {email || 'Unknown email'}
        </Text>
        <Text style={styles.accountMeta}>{shortId}</Text>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    // SettingsSectionCard
    card: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      marginBottom: 16,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
      overflow: 'hidden',
    },
    cardLabelRow: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 6,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.mutedForeground,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    cardLabelSub: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 2,
    },
    cardBody: {
      paddingHorizontal: 4,
      paddingBottom: 4,
    },

    // SettingsRow / PreferenceSwitchRow
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 60,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.surface_container_low,
    },
    rowPressed: {
      backgroundColor: tokens.surface_container_low,
    },
    rowIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: tokens.surface_container_low,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
    },
    rowContent: {
      flex: 1,
      marginRight: 8,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: tokens.foreground,
    },
    rowSub: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 2,
    },

    // SegmentedThemeSelector
    themeTrack: {
      flexDirection: 'row',
      backgroundColor: tokens.surface_container_low,
      borderRadius: 12,
      padding: 3,
    },
    themePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 7,
      borderRadius: 9,
      gap: 5,
    },
    themePillActive: {
      backgroundColor: tokens.card,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },
    themePillLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.mutedForeground,
    },
    themePillLabelActive: {
      color: tokens.primary,
    },

    // AccountCard
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    avatarRing: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: tokens.primaryAlpha15,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    avatarInitials: {
      fontSize: 16,
      fontWeight: '800',
      color: tokens.primary,
      letterSpacing: 1,
    },
    accountCopy: {
      flex: 1,
    },
    accountEmail: {
      fontSize: 15,
      fontWeight: '700',
      color: tokens.foreground,
    },
    accountMeta: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 3,
    },
  });
