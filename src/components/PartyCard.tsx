import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';

export type PartyStatus = 'RECEIVABLE' | 'PAYABLE' | 'SETTLED' | 'OVERDUE';

export interface PartyModel {
  id: string;
  name: string;
  phone: string;
  balance: number;
  status: PartyStatus;
  partyType?: 'CUSTOMER' | 'VENDOR';
}

interface PartyCardProps {
  party: PartyModel;
  onPress: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatCurrency = (value: number) => {
  const absoluteValue = Math.abs(value);
  return `₹${absoluteValue.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const PartyCard: React.FC<PartyCardProps> = ({ party, onPress }) => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const initials = getInitials(party.name);
  const isPayable = party.status === 'PAYABLE' || party.balance < 0;
  const isSettled = party.status === 'SETTLED' || party.balance === 0;
  const isOverdue = party.status === 'OVERDUE';

  const balanceColor = isPayable
    ? tokens.destructive
    : isSettled
    ? tokens.mutedForeground
    : tokens.primary;

  const statusLabel = party.status;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {party.name}
          </Text>
          <Text style={styles.phone}>{party.phone}</Text>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceText, { color: balanceColor }]}>
            {isPayable ? `-${formatCurrency(party.balance)}` : formatCurrency(party.balance)}
          </Text>

          <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: balanceColor }]} />
              <Text style={[styles.statusLabel, { color: balanceColor }]}>
                  {statusLabel}
              </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.surface_container_lowest,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 0, // Design shows them touching/stacked or with minimal gap
      // Using shadow for elevation instead of borders
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    pressed: {
      opacity: 0.7,
      backgroundColor: tokens.muted,
    },
    avatarContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(74, 222, 128, 0.1)', // Subtle green tint for avatars
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    avatarText: {
      color: tokens.primary,
      fontWeight: '700',
      fontSize: 16,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    info: {
      flex: 1,
      marginRight: 12,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.foreground,
      marginBottom: 2,
    },
    phone: {
      fontSize: 14,
      color: tokens.mutedForeground,
    },
    balanceContainer: {
      alignItems: 'flex-end',
    },
    balanceText: {
      fontSize: 16,
      fontWeight: '700',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    statusLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });

export default React.memo(PartyCard);
