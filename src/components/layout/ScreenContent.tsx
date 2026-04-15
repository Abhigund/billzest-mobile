import React, { useMemo } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TopPaddingPreset = 'none' | 'compact' | 'default';

interface ScreenContentPaddingOptions {
  horizontal?: number;
  top?: TopPaddingPreset | number;
  bottom?: number;
}

interface ScreenContentProps extends ScreenContentPaddingOptions {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const resolveTopPadding = (top: TopPaddingPreset | number | undefined): number => {
  if (typeof top === 'number') return top;
  if (top === 'none') return 0;
  if (top === 'default') return 20;
  return 10;
};

export const useScreenContentPadding = (
  options: ScreenContentPaddingOptions = {},
): ViewStyle => {
  const insets = useSafeAreaInsets();
  const { horizontal = 16, top = 'compact', bottom = 120 } = options;

  return useMemo(
    () => ({
      paddingHorizontal: horizontal,
      paddingTop: resolveTopPadding(top),
      paddingBottom: bottom + Math.max(insets.bottom - 8, 0),
    }),
    [bottom, horizontal, insets.bottom, top],
  );
};

const ScreenContent: React.FC<ScreenContentProps> = ({
  children,
  style,
  horizontal,
  top,
  bottom,
}) => {
  const contentPadding = useScreenContentPadding({ horizontal, top, bottom });

  return <View style={[contentPadding, style]}>{children}</View>;
};

export default ScreenContent;
