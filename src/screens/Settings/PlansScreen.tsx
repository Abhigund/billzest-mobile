import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Crown,
  Sparkles,
  Check,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/ui/Button';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

type Plan = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  highlight: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹199',
    cadence: 'per month',
    highlight: 'Essential billing tools',
    features: [
      'Unlimited invoices',
      '1 thermal printer pairing',
      'Basic analytics dashboard',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '₹399',
    cadence: 'per month',
    highlight: 'Best for multi-branch retail',
    features: [
      'WhatsApp & SMS reminders',
      'Inventory low-stock alerts',
      'Advanced purchase planning',
    ],
  },
];

const PlansScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const [cadence, setCadence] = React.useState<'monthly' | 'annual'>('monthly');

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Crown color={tokens.primary} size={22} />
          </View>
          <Text style={styles.title}>Plans & Billing</Text>
          <Text style={styles.subtitle}>
            Choose a plan that scales with your store.
          </Text>
        </View>

        <View style={styles.switcher}>
          {[
            { id: 'monthly', label: 'Monthly' },
            { id: 'annual', label: 'Annual • 2 months free' },
          ].map(option => (
            <Pressable
              key={option.id}
              onPress={() => setCadence(option.id as 'monthly' | 'annual')}
              style={[
                styles.switchPill,
                cadence === option.id && styles.switchPillActive,
              ]}
            >
              <Text
                style={[
                  styles.switchText,
                  cadence === option.id && styles.switchTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {PLANS.map(plan => (
          <View key={plan.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{plan.name}</Text>
                <Text style={styles.cardHighlight}>{plan.highlight}</Text>
              </View>
              <Sparkles color={tokens.primary} size={18} />
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {cadence === 'annual' ? '₹3990' : plan.price}
              </Text>
              <Text style={styles.cadence}>
                {cadence === 'annual' ? 'per year' : plan.cadence}
              </Text>
            </View>
            <View style={styles.features}>
              {plan.features.map(feature => (
                <View key={feature} style={styles.featureRow}>
                  <Check color={tokens.primary} size={16} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            {/* OUT OF SCOPE FOR V1 — retained for future releases
            <Button
              label={
                plan.id === 'growth' ? 'Upgrade to Growth' : 'Stay on Starter'
              }
              fullWidth
            />
            */}
          </View>
        ))}

        <View style={styles.footerCard}>
          <View>
            <Text style={styles.footerTitle}>Billing history</Text>
            <Text style={styles.footerMeta}>
              View past invoices and download receipts.
            </Text>
          </View>
          <ChevronRight color={tokens.mutedForeground} size={18} />
        </View>

        <View style={styles.supportRow}>
          <Clock color={tokens.primary} size={18} />
          <Text style={styles.supportText}>
            Need help? Our billing team responds within 2 working hours on
            WhatsApp.
          </Text>
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
    switcher: {
      flexDirection: 'row',
      backgroundColor: tokens.background,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 4,
      marginBottom: 16,
    },
    switchPill: {
      flex: 1,
      borderRadius: 999,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    switchPillActive: {
      backgroundColor: tokens.card,
      borderWidth: 1,
      borderColor: tokens.primary,
    },
    switchText: { color: tokens.mutedForeground, fontWeight: '600' },
    switchTextActive: { color: tokens.foreground },
    card: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: tokens.foreground },
    cardHighlight: { color: tokens.mutedForeground, marginTop: 4 },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 12,
    },
    price: { fontSize: 28, fontWeight: '700', color: tokens.foreground },
    cadence: { marginLeft: 8, color: tokens.mutedForeground },
    features: { marginBottom: 16 },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    featureText: { marginLeft: 8, color: tokens.foreground, flex: 1 },
    footerCard: {
      backgroundColor: tokens.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    footerTitle: { fontWeight: '700', color: tokens.foreground },
    footerMeta: { color: tokens.mutedForeground, marginTop: 4 },
    supportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    supportText: { marginLeft: 10, color: tokens.foreground, flex: 1 },
  });

export default PlansScreen;
