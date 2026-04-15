import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';
import { MoreVertical } from 'lucide-react-native';

const getStatusVisual = (status: string, tokens: ThemeTokens) => {
  switch (status?.toLowerCase()) {
    case 'paid':      return { label: 'PAID',      color: tokens.primary,          bg: tokens.primaryAlpha15 };
    case 'overdue':   return { label: 'OVERDUE',   color: tokens.destructive,      bg: tokens.destructiveAlpha15 };
    case 'draft':     return { label: 'DRAFT',      color: tokens.mutedForeground,  bg: tokens.muted };
    case 'sent':      return { label: 'SENT',       color: tokens.warning,          bg: tokens.warningAlpha15 };
    case 'cancelled': return { label: 'CANCELLED',  color: tokens.destructive,      bg: tokens.destructiveAlpha10 };
    default:          return { label: 'PENDING',    color: tokens.warning,          bg: tokens.warningAlpha15 };
  }
};

export type InvoiceStatus =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'draft'
  | 'cancelled';

export interface InvoiceProp {
  id: string;
  invoiceNumber: string;
  clientName: string;
  date: string;
  dueDate?: string;
  amount: number;
  balance?: number;
  status: string;
  currency?: string;
}

interface InvoiceCardProps {
  invoice: InvoiceProp;
  onPress: () => void;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onShare?: () => void;
  onPayment?: () => void;
}

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const date = dateString.includes('T')
    ? new Date(dateString)
    : new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) {
    const fallback = new Date(dateString);
    if (isNaN(fallback.getTime())) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return fallback.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onPress,
  variant = 'default',
  showActions = true,
  onShare,
  onPayment,
}) => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (variant === 'compact') {
    return (
      <Pressable
        style={({ pressed }) => [styles.compactRow, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View style={styles.compactLeft}>
          <Text style={styles.compactClientName} numberOfLines={1}>{invoice.clientName}</Text>
          <View style={styles.compactMeta}>
            <Text style={styles.compactInvoiceChip}>#{invoice.invoiceNumber}</Text>
            <Text style={styles.compactDate}>{formatDateSafe(invoice.date)}</Text>
          </View>
        </View>
        <Text style={styles.compactAmount}>{formatCurrency(invoice.amount)}</Text>
      </Pressable>
    );
  }

  const sv = getStatusVisual(invoice.status, tokens);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.left}>
        <Text style={styles.clientName} numberOfLines={1}>{invoice.clientName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.invoiceChip}>#{invoice.invoiceNumber}</Text>
          <Text style={styles.date}>{formatDateSafe(invoice.date)}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={styles.amountCol}>
          <Text style={styles.amount}>{formatCurrency(invoice.amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sv.bg }]}>
            <Text style={[styles.statusBadgeText, { color: sv.color }]}>{sv.label}</Text>
          </View>
        </View>
        {showActions && (
          <Pressable
            style={styles.menuBtn}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            onPress={onPayment}
            accessibilityLabel="Invoice options"
          >
            <MoreVertical color={tokens.mutedForeground} size={18} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    row: {
      backgroundColor: tokens.surface_container_lowest,
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: tokens.spacingMd, // 12px
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    compactRow: {
      backgroundColor: tokens.surface_container_lowest,
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: tokens.spacingMd, // 12px
      borderRadius: tokens.radiusSm, // 8px
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: tokens.spacingXs, // 4px
    },
    pressed: {
      backgroundColor: tokens.muted,
    },
    left: {
      flex: 1,
      paddingRight: tokens.spacingMd, // 12px
      gap: tokens.spacingXs, // 4px
    },
    clientName: {
      color: tokens.foreground,
      fontWeight: '600', // Semi-bold
      fontSize: 14, // Primary size for compact
      letterSpacing: -0.2,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacingSm, // 8px
    },
    invoiceChip: {
      fontSize: 10, // Secondary size
      fontFamily: 'monospace',
      color: tokens.mutedForeground,
      backgroundColor: tokens.muted,
      paddingHorizontal: 6, // Minimal for chip
      paddingVertical: 2, // Minimal for chip
      borderRadius: tokens.radiusXs, // 4px
      overflow: 'hidden',
    },
    date: {
      fontSize: 11,
      color: tokens.mutedForeground,
      fontWeight: '400', // Regular
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacingXs, // 4px
    },
    amountCol: {
      alignItems: 'flex-end',
      gap: 3,
    },
    amount: {
      color: tokens.foreground,
      fontWeight: '700', // Bold for emphasis
      fontSize: 14, // Emphasis size
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: tokens.radiusXs,
    },
    statusBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    menuBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: tokens.spacingXs,
    },
    compactLeft: {
      flex: 1,
      paddingRight: tokens.spacingMd, // 12px
      gap: tokens.spacingXs, // 4px
    },
    compactClientName: {
      color: tokens.foreground,
      fontWeight: '600', // Semi-bold
      fontSize: 13, // Primary size for compact
    },
    compactMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacingSm, // 8px
    },
    compactInvoiceChip: {
      fontSize: 10,
      fontFamily: 'monospace',
      color: tokens.mutedForeground,
      backgroundColor: tokens.muted,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 3,
      overflow: 'hidden',
    },
    compactDate: {
      fontSize: 11, // Secondary size
      color: tokens.mutedForeground,
      fontWeight: '400', // Regular
    },
    compactAmount: {
      color: tokens.foreground,
      fontWeight: '700', // Bold for emphasis
      fontSize: 13, // Emphasis size for compact
    },
  });

export default React.memo(InvoiceCard);
