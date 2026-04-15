import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'modal';
  style?: StyleProp<ViewStyle>;
  showBorder?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  rightElement,
  variant = 'default',
  style,
  showBorder = false,
}) => {
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const styles = createStyles(tokens);

  const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

  return (
    <View
      style={[
        styles.container,
        showBorder && styles.border,
        variant === 'modal' && { paddingTop: insets.top || 8 },
        style,
      ]}
    >
      <View style={styles.content}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
          hitSlop={hitSlop}
        >
          <ArrowLeft size={24} color={tokens.primary} strokeWidth={2.5} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightContainer}>
          {rightElement || <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      backgroundColor: tokens.background,
    },
    border: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      height: 56,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: tokens.foreground,
      textAlign: 'center',
    },
    rightContainer: {
      width: 40,
      alignItems: 'flex-end',
    },
    placeholder: {
      width: 40,
    },
  });

export default ScreenHeader;
