import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style }) => {
  const { tokens, mode } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const barStyle = mode === 'dark' ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor={tokens.background} barStyle={barStyle} />
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    container: {
      flex: 1,
      backgroundColor: tokens.background,
      position: 'relative',
    },
  });

export default ScreenWrapper;
