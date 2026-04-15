import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Menu } from 'lucide-react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

interface ListHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const ListHeader: React.FC<ListHeaderProps> = ({
  title,
  rightElement,
  style,
}) => {
  const { tokens } = useThemeTokens();
  const navigation = useNavigation();
  const styles = createStyles(tokens);

  const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          accessibilityLabel="Open sidebar menu"
          hitSlop={hitSlop}
          style={styles.menuButton}
        >
          <Menu color={tokens.foreground} size={22} />
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
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      height: 56,
      gap: 12,
    },
    menuButton: {
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
    },
    rightContainer: {
      width: 40,
      alignItems: 'flex-end',
    },
    placeholder: {
      width: 40,
    },
  });

export default ListHeader;
