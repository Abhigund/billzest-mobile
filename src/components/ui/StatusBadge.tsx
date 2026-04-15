import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

export type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive';
export type BadgeVariant = 'solid' | 'subtle';
export type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  status?: StatusType;
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'neutral',
  label,
  variant = 'subtle',
  size = 'md',
  containerStyle,
  textStyle,
}) => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);

  const getColors = (): { bg: string; text: string; border?: string } => {
    switch (status) {
      case 'success':
      case 'default':
        return {
          bg: variant === 'solid' ? tokens.success : tokens.primaryAlpha20,
          text: variant === 'solid' ? tokens.successForeground : tokens.success,
        };
      case 'warning':
        return {
          bg: variant === 'solid' ? tokens.warning : tokens.warningAlpha20,
          text: variant === 'solid' ? tokens.warningForeground : tokens.warning,
        };
      case 'error':
      case 'destructive':
        return {
          bg: variant === 'solid' ? tokens.destructive : tokens.destructiveAlpha20,
          text:
            variant === 'solid'
              ? tokens.destructiveForeground
              : tokens.destructive,
        };
      case 'info':
        return {
          bg: variant === 'solid' ? tokens.info : tokens.infoAlpha15,
          text: variant === 'solid' ? tokens.infoForeground : tokens.info,
        };
      case 'secondary':
        return {
          bg: tokens.secondary,
          text: tokens.secondaryForeground,
          border: tokens.border,
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: tokens.mutedForeground,
          border: tokens.border,
        };
      case 'neutral':
      default:
        return {
          bg: tokens.muted,
          text: tokens.mutedForeground,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: size === 'sm' ? 10 : 14,
          paddingVertical: size === 'sm' ? 4 : 6,
          borderWidth: colors.border ? 1 : 0,
          borderColor: colors.border ?? 'transparent',
        },
        containerStyle,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: size === 'sm' ? 10 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const createStyles = (_tokens: ThemeTokens) =>
  StyleSheet.create({
    badge: {
      borderRadius: 999,
      alignSelf: 'flex-start',
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontWeight: '700',
    },
  });

export default StatusBadge;
