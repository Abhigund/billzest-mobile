import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAppSettingsStore } from '../stores/appSettingsStore';
import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Settings,
  CreditCard,
  PieChart,
  Zap,
} from 'lucide-react-native';

const NAV_ITEMS = [
  { key: 'Home', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'Purchases', label: 'Purchases', icon: ShoppingBag },
  { key: 'CreditBook', label: 'Credit Book', icon: Wallet },
  { key: 'Expenses', label: 'Expenses', icon: CreditCard },
  { key: 'Reports', label: 'Reports', icon: PieChart },
  { key: 'SettingsStack', label: 'Settings', icon: Settings },
];

const CustomDrawer: React.FC<DrawerContentComponentProps> = props => {
  const { state, navigation } = props;
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const { user } = useSupabase();
  const { simplifiedPOSEnabled, setSimplifiedPOSEnabled } =
    useAppSettingsStore();

  const activeRoute = state.routeNames[state.index];

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.email?.[0] || 'U').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>Welcome</Text>
        <Text style={styles.email}>{user?.email || '—'}</Text>
      </View>

      <View style={styles.divider} />

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

        {/* ── Simplified POS entry (only shown when toggle is on) ── */}
        {simplifiedPOSEnabled && (
          <DrawerItem
            label="Quick Bill POS"
            focused={activeRoute === 'SimplifiedPOS'}
            onPress={() => navigation.navigate('SimplifiedPOS' as never)}
            icon={({ color }) => <Zap color={color} size={18} />}
            labelStyle={styles.itemLabel}
            inactiveTintColor={tokens.foreground}
            activeTintColor={tokens.primaryForeground}
            activeBackgroundColor={tokens.primary}
            style={styles.item}
          />
        )}

        {/* ── Simplified POS toggle ── */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleIcon}>
            <Zap size={18} color={simplifiedPOSEnabled ? tokens.primary : tokens.mutedForeground} />
          </View>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Simplified POS</Text>
            <Text style={styles.toggleSub}>For small product catalogs</Text>
          </View>
          <Switch
            value={simplifiedPOSEnabled}
            onValueChange={setSimplifiedPOSEnabled}
            trackColor={{ false: tokens.border, true: 'rgba(29,185,84,0.6)' }}
            thumbColor={simplifiedPOSEnabled ? tokens.primary : tokens.mutedForeground}
          />
        </View>
      </View>
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
      paddingBottom: 12,
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
    },
    divider: {
      height: 1,
      backgroundColor: tokens.border,
      marginHorizontal: 16,
      marginVertical: 12,
      display: 'none', // Hide divider as color separation is enough
    },
    itemsContainer: {
      backgroundColor: tokens.background,
      borderRadius: 16,
      paddingVertical: 8,
      flex: 1, // Ensure it takes remaining space if needed
    },
    item: {
      marginHorizontal: 8,
      borderRadius: 10,
      marginBottom: 4,
    },
    itemLabel: {
      fontWeight: '600',
    },
    // Simplified POS toggle row
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 8,
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: tokens.muted,
      opacity: 0.6,
    },
    toggleIcon: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    toggleInfo: { flex: 1 },
    toggleLabel: {
      fontWeight: '600',
      fontSize: 14,
      color: tokens.foreground,
    },
    toggleSub: {
      fontSize: 11,
      color: tokens.mutedForeground,
      marginTop: 1,
    },
  });

export default CustomDrawer;
