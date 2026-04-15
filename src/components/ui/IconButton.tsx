import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'default',
  size = 'md',
  style,
  hitSlop = { top: 10, bottom: 10, left: 10, right: 10 },
}) => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens, variant, size);

  return (
    <Pressable
      style={[styles.button, style]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
    >
      {icon}
    </Pressable>
  );
};

const createStyles = (
  tokens: ThemeTokens,
  variant: 'default' | 'primary' | 'secondary',
  size: 'sm' | 'md' | 'lg'
) => {
  // Size configurations
  const sizeConfig = {
    sm: { size: 32, iconSize: 14 },
    md: { size: 40, iconSize: 18 },
    lg: { size: 48, iconSize: 22 },
  };

  const config = sizeConfig[size];

  // Variant configurations
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: tokens.primary,
          borderColor: tokens.primary,
        };
      case 'secondary':
        return {
          backgroundColor: tokens.surface_container_low,
          borderColor: tokens.border,
        };
      default:
        return {
          backgroundColor: tokens.card,
          borderColor: tokens.border,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return StyleSheet.create({
    button: {
      width: config.size,
      height: config.size,
      borderRadius: tokens.radiusSm, // 8px for consistency
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      ...variantStyles,
    },
  });
};

export default IconButton;
