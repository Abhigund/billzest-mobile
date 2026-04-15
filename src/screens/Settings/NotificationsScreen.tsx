import React from 'react';
import { ScrollView, View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { Bell, MessageSquare, Clock, ChevronRight } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/ui/Button';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

type ToggleState = Record<string, boolean>;

const REMINDER_TYPES = [
  { id: 'dueInvoices', label: 'Due Invoice Reminders', description: 'Send WhatsApp reminders a day before due date.' },
  { id: 'lowStock', label: 'Low Stock Alerts', description: 'Notify when product stock falls below reorder point.' },
  { id: 'supplier', label: 'Supplier Follow-ups', description: 'Remind to confirm purchase receipts after 3 days.' },
];

const NotificationsScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const [toggles, setToggles] = React.useState<ToggleState>({
    push: true,
    email: false,
    sms: true,
    dueInvoices: true,
    lowStock: true,
    supplier: false,
  });

  const handleToggle = (id: string) => setToggles(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Bell color={tokens.primary} size={22} />
          </View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Decide how BillZest nudges your team and customers.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Channels</Text>
          {[
            { id: 'push', label: 'Push Notifications' },
            { id: 'sms', label: 'SMS / WhatsApp' },
            { id: 'email', label: 'Email Updates' },
          ].map(channel => (
            <View key={channel.id} style={styles.row}>
              <Text style={styles.rowLabel}>{channel.label}</Text>
              <Switch
                value={toggles[channel.id]}
                onValueChange={() => handleToggle(channel.id)}
                thumbColor={toggles[channel.id] ? tokens.primary : '#f4f3f4'}
                trackColor={{ false: tokens.border, true: tokens.primary }}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Automated reminders</Text>
          {REMINDER_TYPES.map(reminder => (
            <View key={reminder.id} style={styles.reminderRow}>
              <View style={styles.reminderCopy}>
                <Text style={styles.rowLabel}>{reminder.label}</Text>
                <Text style={styles.rowCaption}>{reminder.description}</Text>
              </View>
              <Switch
                value={toggles[reminder.id]}
                onValueChange={() => handleToggle(reminder.id)}
                thumbColor={toggles[reminder.id] ? tokens.primary : '#f4f3f4'}
                trackColor={{ false: tokens.border, true: tokens.primary }}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quiet hours</Text>
          <View style={styles.reminderRow}>
            <View style={styles.reminderCopy}>
              <Text style={styles.rowLabel}>Pause alerts between</Text>
              <Text style={styles.rowCaption}>10:00 PM - 8:00 AM</Text>
            </View>
            <Clock color={tokens.mutedForeground} size={18} />
          </View>
          <Pressable style={styles.quietRow}>
            <Text style={styles.quietLabel}>Update quiet hours</Text>
            <ChevronRight color={tokens.mutedForeground} size={18} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Templates</Text>
          <Pressable style={styles.templateRow}>
            <MessageSquare color={tokens.primary} size={18} />
            <View style={styles.reminderCopy}>
              <Text style={styles.rowLabel}>Invoice reminder copy</Text>
              <Text style={styles.rowCaption}>Customize WhatsApp tone & CTA.</Text>
            </View>
            <ChevronRight color={tokens.mutedForeground} size={18} />
          </Pressable>
        </View>

        <Button label="Save Preferences" fullWidth />
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
    sectionTitle: { fontSize: 16, fontWeight: '700', color: tokens.foreground, marginBottom: 12 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    rowLabel: { color: tokens.foreground, fontWeight: '600' },
    rowCaption: { color: tokens.mutedForeground, marginTop: 4 },
    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    reminderCopy: { flex: 1, marginRight: 12 },
    quietRow: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    quietLabel: { color: tokens.primary, fontWeight: '600' },
    templateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
  });

export default NotificationsScreen;
