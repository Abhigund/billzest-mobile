import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Link,
  SmartphoneCharging,
  Calculator,
  MessageCircle,
} from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/ui/Button';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

type Integration = {
  id: string;
  name: string;
  summary: string;
  status: 'connected' | 'disconnected';
  icon: React.ReactNode;
};

const INTEGRATIONS: Integration[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    summary: 'Send invoices and reminders with verified sender IDs.',
    status: 'connected',
    icon: <MessageCircle size={18} />,
  },
  {
    id: 'upi',
    name: 'UPI Payments',
    summary: 'Collect instant UPI or QR payments on every bill.',
    status: 'disconnected',
    icon: <SmartphoneCharging size={18} />,
  },
  {
    id: 'tally',
    name: 'Tally Prime Export',
    summary: 'Sync invoices & purchase data to accountants.',
    status: 'disconnected',
    icon: <Calculator size={18} />,
  },
];

const IntegrationsScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Link color={tokens.primary} size={22} />
          </View>
          <Text style={styles.title}>Integrations</Text>
          <Text style={styles.subtitle}>
            Connect payments, messaging, and accounting tools.
          </Text>
        </View>

        {INTEGRATIONS.map(integration => (
          <View key={integration.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconHolder}>{integration.icon}</View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{integration.name}</Text>
                <Text style={styles.cardSubtitle}>{integration.summary}</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  integration.status === 'connected'
                    ? styles.statusConnected
                    : styles.statusDisconnected,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    integration.status === 'connected'
                      ? styles.statusTextConnected
                      : styles.statusTextDisconnected,
                  ]}
                >
                  {integration.status === 'connected'
                    ? 'Connected'
                    : 'Not connected'}
                </Text>
              </View>
              <Button
                label={
                  integration.status === 'connected' ? 'Manage' : 'Connect'
                }
                variant={
                  integration.status === 'connected' ? 'secondary' : 'primary'
                }
                style={styles.inlineButton}
              />
            </View>
            <Pressable style={styles.metaRow}>
              <Text style={styles.metaLabel}>View setup guide</Text>
              <Text style={styles.metaValue}>~5 mins</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Need a new integration?</Text>
          <Text style={styles.footerCaption}>
            Tell us about your POS, ERP, or marketing stack.
          </Text>
          <Button
            label="Request integration"
            fullWidth
            style={styles.footerButton}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 80 },
    header: { marginBottom: 12 },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tokens.primaryAlpha20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    title: { fontSize: 24, fontWeight: '700', color: tokens.foreground },
    subtitle: { color: tokens.mutedForeground, marginTop: 6 },
    card: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 16,
    },
    cardHeader: { flexDirection: 'row', marginBottom: 12 },
    iconHolder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tokens.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardCopy: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: tokens.foreground },
    cardSubtitle: { color: tokens.mutedForeground, marginTop: 4 },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusBadge: {
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
    },
    statusConnected: {
      backgroundColor: '#052e16',
      borderColor: '#16a34a',
    },
    statusDisconnected: {
      backgroundColor: tokens.background,
      borderColor: tokens.border,
    },
    statusText: { fontWeight: '600' },
    statusTextConnected: { color: '#86efac' },
    statusTextDisconnected: { color: tokens.mutedForeground },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
    },
    metaLabel: { color: tokens.primary, fontWeight: '600' },
    metaValue: { color: tokens.mutedForeground },
    inlineButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    footerCard: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    footerTitle: { fontSize: 16, fontWeight: '700', color: tokens.foreground },
    footerCaption: { color: tokens.mutedForeground, marginTop: 6 },
    footerButton: { marginTop: 14 },
  });

export default IntegrationsScreen;
