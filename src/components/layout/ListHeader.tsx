import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Bell } from 'lucide-react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { useSupabase } from '../../contexts/SupabaseContext';

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
  const { user } = useSupabase();
  const navigation = useNavigation();
  const styles = createStyles(tokens);

  const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
  const initial = (user?.email?.[0] || 'S').toUpperCase();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Avatar — tapping opens drawer */}
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          accessibilityLabel="Open sidebar menu"
          hitSlop={hitSlop}
          style={styles.avatarButton}
        >
          <View style={[styles.avatar, { backgroundColor: tokens.primary }]}>
            <Text style={[styles.avatarText, { color: tokens.primaryForeground }]}>
              {initial}
            </Text>
          </View>
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightContainer}>
          {rightElement ?? (
            <Pressable
              hitSlop={hitSlop}
              accessibilityLabel="Notifications"
              style={styles.bellButton}
            >
              <Bell color={tokens.foreground} size={20} />
            </Pressable>
          )}
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
    avatarButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 15,
      fontWeight: '700',
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
    bellButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default ListHeader;
