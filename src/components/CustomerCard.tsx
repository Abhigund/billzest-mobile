import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';
import StatusBadge from './ui/StatusBadge';
import { Phone, MessageSquare, Share2 } from 'lucide-react-native';

export type Customer = {
  id: string;
  name: string;
  businessType: string;
  location: string;
  dueAmount: number;
  totalSale: number;
  lastInvoice: string;
  status: 'clear' | 'due' | 'overdue';
  phone: string;
};

interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
  onPhonePress?: () => void;
  onMessagePress?: () => void;
  onSharePress?: () => void;
}

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onPress,
  onPhonePress,
  onMessagePress,
  onSharePress,
}) => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        customer.status === 'overdue' && styles.containerOverdue,
        customer.status === 'clear' && styles.containerClear,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${customer.name}`}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.meta}>
            {customer.businessType} · {customer.location}
          </Text>
        </View>
        <StatusBadge
          status={
            customer.status === 'clear'
              ? 'success'
              : customer.status === 'overdue'
              ? 'error'
              : 'warning'
          }
          label={customer.status.toUpperCase()}
          size="sm"
        />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Due Amount</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(customer.dueAmount)}
          </Text>
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Total Sale</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(customer.totalSale)}
          </Text>
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Last Invoice</Text>
          <Text style={styles.detailValue}>{customer.lastInvoice}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Contact</Text>
          <Text style={styles.footerValue}>{customer.phone}</Text>
        </View>
        <View style={styles.footerActions}>
          <Pressable style={styles.iconButton} onPress={onPhonePress}>
            <Phone color={tokens.foreground} size={16} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onMessagePress}>
            <MessageSquare color={tokens.foreground} size={16} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onSharePress}>
            <Share2 color={tokens.foreground} size={16} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: tokens.spacingMd, // 12px
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: tokens.spacingMd, // 12px
    },
    containerOverdue: {
      borderColor: tokens.destructive,
      backgroundColor: 'rgba(239, 68, 68, 0.05)', // Very subtle red tint
    },
    containerClear: {
      borderColor: tokens.border, // Keep default border for clear
    },
    pressed: {
      opacity: 0.95,
      transform: [{ scale: 0.99 }],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacingMd, // 12px
    },
    titleBlock: {
      flex: 1,
      paddingRight: tokens.spacingMd, // 12px
    },
    name: {
      color: tokens.foreground,
      fontWeight: '600', // Semi-bold
      fontSize: 16, // Primary size
      letterSpacing: -0.2,
    },
    meta: {
      color: tokens.mutedForeground,
      marginTop: tokens.spacingXs, // 4px
      fontSize: 12, // Secondary size
      fontWeight: '400', // Regular
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: tokens.spacingLg, // 16px
    },
    detailBlock: {
      flex: 1,
      paddingRight: tokens.spacingSm, // 8px
    },
    detailLabel: {
      color: tokens.mutedForeground,
      fontSize: 12, // Secondary size
      fontWeight: '400', // Regular
      marginBottom: tokens.spacingXs, // 4px
    },
    detailValue: {
      color: tokens.foreground,
      fontWeight: '700', // Bold for emphasis
      fontSize: 14, // Emphasis size
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    footerLabel: {
      color: tokens.mutedForeground,
      fontSize: 12, // Secondary size
      fontWeight: '400', // Regular
    },
    footerValue: {
      color: tokens.foreground,
      fontWeight: '500', // Medium weight
      marginTop: 4,
      fontSize: 13, // Between secondary and emphasis
    },
    footerActions: {
      flexDirection: 'row',
      marginLeft: -tokens.spacingSm, // -8px
      marginTop: tokens.spacingSm, // 8px
    },
    iconButton: {
      borderRadius: tokens.radiusFull,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: tokens.spacingSm, // 8px
      paddingVertical: 6, // Not a multiple of 8 but minimal for touch
      marginLeft: tokens.spacingSm, // 8px
    },
  });

export default React.memo(CustomerCard);
