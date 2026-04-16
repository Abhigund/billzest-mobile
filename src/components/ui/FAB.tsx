import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

interface FABProps {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const FAB: React.FC<FABProps> = ({
  label,
  icon,
  onPress,
  accessibilityLabel,
  style,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && <View style={styles.iconSlot}>{icon}</View>}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 32,
      backgroundColor: tokens.primary,
      borderRadius: 999,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: tokens.shadowColor,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 6,
    },
    iconSlot: {
      marginRight: 10,
    },
    label: {
      color: tokens.primaryForeground,
      fontWeight: '700',
      fontSize: 15,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
  });

export default FAB;
