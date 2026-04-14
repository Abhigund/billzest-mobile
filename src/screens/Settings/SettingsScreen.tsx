import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/ui/Button';
import {
  User,
  Building,
  Printer,
  ShieldCheck,
  ChevronRight,
  Bell,
  LogOut,
  Globe,
} from 'lucide-react-native';
import { useSupabase } from '../../contexts/SupabaseContext';
import { supabase } from '../../supabase/supabaseClient';
import { logger } from '../../utils/logger';
import type { AppNavigationParamList } from '../../navigation/types';

const SECTIONS = [
  {
    id: 'account',
    title: 'Account',
    rows: [
      { id: 'profile', label: 'Profile & Password', icon: <User size={18} /> },
      /* { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> }, */
    ],
  },
  {
    id: 'business',
    title: 'Business Profile',
    rows: [
      { id: 'store', label: 'Business Details', icon: <Building size={18} /> },
      { id: 'online_store', label: 'Online Store', icon: <Globe size={18} /> },
      { id: 'billing', label: 'Billing Settings', icon: <Printer size={18} /> },
      /* { id: 'gst', label: 'GST & Compliance', icon: <ShieldCheck size={18} /> }, */
    ],
  },
  {
    id: 'utilities',
    title: 'Utilities',
    rows: [
      { id: 'barcodes', label: 'Barcode Generator', icon: <Printer size={18} /> },
    ],
  },
  /*
  {
    id: 'devices',
    title: 'Printers & Devices',
    rows: [
      {
        id: 'printer',
        label: 'Bluetooth Printers',
        icon: <Printer size={18} />,
      },
    ],
  },
  */
];

const SettingsScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const [darkMode, setDarkMode] = React.useState(false);
  const { user } = useSupabase();
  const [signingOut, setSigningOut] = React.useState(false);

  const performLogout = async (scope?: 'local' | 'global') => {
    // Global removes server session; local clears device session only.
    return supabase.auth.signOut(scope ? { scope } : undefined);
  };

  const handleLogout = async () => {
    try {
      setSigningOut(true);

      let { error } = await performLogout('global');

      if (error) {
        logger.warn('[Settings] Global sign-out failed, retrying local', error);
        // Fallback to local-only sign-out so UI can still exit to login.
        const localResult = await performLogout('local');
        error = localResult.error;
      }

      if (error) {
        Alert.alert('Logout failed', error.message || 'Could not sign out.');
      } else {
        Alert.alert('Signed out', 'You have been logged out.');
      }
      // RootNavigator listens to Supabase session; no manual navigation reset needed.
    } catch (err) {
      logger.error('[Settings] Logout failed', err);
      Alert.alert('Logout failed', 'Unexpected error. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const confirmLogout = () => {
    // Protect against accidental logouts
    if (signingOut) return;
    Alert.alert('Log out?', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: handleLogout },
    ]);
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Control account, business, and device preferences.
          </Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.id} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.id === 'account' && (
              <View style={styles.profileRow}>
                <View style={styles.profileAvatar}>
                  <User color={tokens.primary} size={18} />
                </View>
                <View style={styles.profileCopy}>
                  <Text style={styles.profileEmail}>
                    {user?.email || 'Unknown email'}
                  </Text>
                  <Text style={styles.profileMeta}>
                    User ID: {user?.id ? user.id : 'Unavailable'}
                  </Text>
                </View>
              </View>
            )}
            {section.rows.map(row => (
              <Pressable
                key={row.id}
                style={styles.row}
                onPress={() => {
                  if (row.id === 'store') navigation.navigate('BusinessInfo');
                  if (row.id === 'online_store') navigation.navigate('OnlineStoreConfig');
                  if (row.id === 'billing') navigation.navigate('BillingTemplates');
                  if (row.id === 'barcodes') navigation.navigate('ProductsTab', { screen: 'BarcodeGenerator' });
                }}
              >
                <View style={styles.rowIcon}>{row.icon}</View>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <ChevronRight color={tokens.mutedForeground} size={18} />
              </Pressable>
            ))}
          </View>
        ))}

        {/* OUT OF SCOPE FOR V1 — retained for future releases
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Pressable style={styles.row}>
            <View style={styles.rowIcon}>
              <ShieldCheck size={18} />
            </View>
            <Text style={styles.rowLabel}>Enable Passcode</Text>
            <ChevronRight color={tokens.mutedForeground} size={18} />
          </Pressable>
        </View>
        */}

        <View style={styles.actions}>
          {/* OUT OF SCOPE FOR V1 — retained for future releases
          <Button label="Manage Subscription" fullWidth />
          */}
          <Button
            label="Log Out"
            variant="secondary"
            fullWidth
            style={styles.secondaryCta}
            icon={<LogOut color={tokens.foreground} size={16} />}
            loading={signingOut}
            onPress={confirmLogout}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 80,
    },
    headerBlock: {
      marginBottom: 18,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: tokens.foreground,
    },
    subtitle: {
      color: tokens.mutedForeground,
      marginTop: 6,
    },
    card: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 18,
      marginBottom: 16,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    profileAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tokens.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    profileCopy: { flex: 1 },
    profileEmail: { color: tokens.foreground, fontWeight: '700' },
    profileMeta: { color: tokens.mutedForeground, marginTop: 4 },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    themeTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
    },
    themeMeta: {
      color: tokens.mutedForeground,
      marginTop: 6,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: tokens.foreground,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: tokens.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rowLabel: {
      flex: 1,
      color: tokens.foreground,
      fontWeight: '600',
    },
    actions: {
      marginTop: 12,
    },
    secondaryCta: {
      marginTop: 12,
    },
  });

export default SettingsScreen;
