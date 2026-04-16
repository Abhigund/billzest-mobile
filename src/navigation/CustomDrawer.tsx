import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';
import { useSupabase } from '../contexts/SupabaseContext';
import { supabase } from '../supabase/supabaseClient';
import { logger } from '../utils/logger';
import {
  Settings,
  PieChart,
  LogOut,
} from 'lucide-react-native';

const NAV_ITEMS = [
  { key: 'Reports', label: 'Reports', icon: PieChart },
  { key: 'SettingsStack', label: 'Settings', icon: Settings },
];

const CustomDrawer: React.FC<DrawerContentComponentProps> = props => {
  const { state, navigation } = props;
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const { user } = useSupabase();
  const [signingOut, setSigningOut] = React.useState(false);

  const activeRoute = state.routeNames[state.index];

  const handleLogout = () => {
    if (signingOut) return;
    Alert.alert('Log out?', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setSigningOut(true);
            let { error } = await supabase.auth.signOut({ scope: 'global' });
            if (error) {
              logger.warn('[Drawer] Global sign-out failed, retrying local', error);
              const localResult = await supabase.auth.signOut();
              error = localResult.error;
            }
            if (error) {
              Alert.alert('Logout failed', error.message || 'Could not sign out.');
            }
          } catch (err) {
            logger.error('[Drawer] Logout failed', err);
            Alert.alert('Logout failed', 'Unexpected error. Please try again.');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const initial = (user?.email?.[0] || 'U').toUpperCase();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>Welcome</Text>
        <Text style={styles.email}>{user?.email || '—'}</Text>
      </View>

      {/* Nav items */}
      <View style={styles.itemsContainer}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeRoute === item.key;
          return (
            <DrawerItem
              key={item.key}
              label={item.label}
              focused={isActive}
              onPress={() => navigation.navigate(item.key as never)}
              icon={({ color }) => <Icon color={color} size={18} />}
              labelStyle={styles.itemLabel}
              inactiveTintColor={tokens.foreground}
              activeTintColor={tokens.primaryForeground}
              activeBackgroundColor={tokens.primary}
              style={styles.item}
            />
          );
        })}
      </View>

      {/* Logout */}
      <Pressable
        style={styles.logoutRow}
        onPress={handleLogout}
        disabled={signingOut}
        accessibilityLabel="Log out"
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <LogOut size={18} color={tokens.destructive} />
        <Text style={[styles.logoutLabel, { color: tokens.destructive }]}>
          {signingOut ? 'Signing out…' : 'Log Out'}
        </Text>
      </Pressable>
    </DrawerContentScrollView>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    scrollContainer: {
      paddingVertical: 12,
      backgroundColor: tokens.muted,
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: tokens.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    avatarText: {
      color: tokens.primaryForeground,
      fontWeight: '700',
      fontSize: 20,
    },
    name: {
      color: tokens.foreground,
      fontSize: 20,
      fontWeight: '800',
    },
    email: {
      color: tokens.mutedForeground,
      marginTop: 2,
      fontSize: 13,
    },
    itemsContainer: {
      backgroundColor: tokens.background,
      borderRadius: 16,
      paddingVertical: 8,
      flex: 1,
    },
    item: {
      marginHorizontal: 8,
      borderRadius: 10,
      marginBottom: 4,
    },
    itemLabel: {
      fontWeight: '600',
    },
    logoutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 24,
      paddingVertical: 16,
      marginTop: 8,
    },
    logoutLabel: {
      fontSize: 15,
      fontWeight: '600',
    },
  });

export default CustomDrawer;
