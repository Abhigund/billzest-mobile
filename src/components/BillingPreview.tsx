import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';
import DetailRow from './ui/DetailRow';

export type BillLineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

export type BillPreviewProps = {
  status: string;
  numberLabel: string;
  numberValue: string;
  primaryDateLabel: string;
  primaryDateValue: string;
  secondaryDateLabel?: string;
  secondaryDateValue?: string;
  partyLabel: string;
  partyName: string;
  partySubValue?: string;
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  notes?: string;
  items: BillLineItem[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);

const BillingPreview: React.FC<BillPreviewProps> = props => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  const {
    status,
    numberLabel,
    numberValue,
    primaryDateLabel,
    primaryDateValue,
    secondaryDateLabel,
    secondaryDateValue,
    partyLabel,
    partyName,
    partySubValue,
    subtotal,
    taxAmount = 0,
    totalAmount,
    notes,
    items,
  } = props;

  return (
    <View style={styles.invoiceCard}>
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brandName}>BillZest Retailers</Text>
          <Text style={styles.brandMeta}>GSTIN: 27AAACB2230M1ZT</Text>
          <Text style={styles.brandMeta}>
            402, Skylark Business Park, Mumbai
          </Text>
        </View>
        {status && (
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeLabel}>{status.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>{numberLabel}</Text>
          <Text style={styles.metaValue}>{numberValue}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>{primaryDateLabel}</Text>
          <Text style={styles.metaValue}>{primaryDateValue}</Text>
        </View>
        {secondaryDateLabel && secondaryDateValue && (
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>{secondaryDateLabel}</Text>
            <Text style={styles.metaValue}>{secondaryDateValue}</Text>
          </View>
        )}
      </View>

      <View style={styles.billToRow}>
        <View style={styles.billToBlock}>
          <Text style={styles.metaLabel}>{partyLabel}</Text>
          <Text style={styles.metaValue}>{partyName || 'Unknown'}</Text>
          {partySubValue && (
            <Text style={styles.metaSubValue}>{partySubValue}</Text>
          )}
        </View>
        <View style={styles.billToBlock}>
          <Text style={styles.metaLabel}>Payment Terms</Text>
          <Text style={styles.metaValue}>15 days credit</Text>
          <Text style={styles.metaSubValue}>UPI · Bank Transfer</Text>
        </View>
      </View>

      <View style={styles.itemsTable}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.colDescription, styles.headerText]}>
            Description
          </Text>
          <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
          <Text style={[styles.colRate, styles.headerText]}>Rate</Text>
          <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
        </View>
        {items.length > 0 ? (
          items.map(item => {
            const amount = item.rate * item.quantity;
            return (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colDescription}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colRate}>{formatCurrency(item.rate)}</Text>
                <Text style={styles.colAmount}>{formatCurrency(amount)}</Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No items in this invoice</Text>
          </View>
        )}
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>GST (18%)</Text>
          <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelBold}>Grand Total</Text>
          <Text style={styles.totalValueBold}>
            {formatCurrency(totalAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerNoteTitle}>Notes</Text>
        <Text style={styles.footerNoteText}>
          {notes?.trim() ||
            'Thank you for shopping with us. This invoice was generated from BillZest.'}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    invoiceCard: {
      borderRadius: tokens.radiusLg, // 16px
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      padding: tokens.spacingLg, // 16px
      marginBottom: tokens.spacingLg, // 16px
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    brandRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: tokens.spacingLg, // 16px
    },
    brandName: {
      fontSize: 18, // Slightly smaller for better balance
      fontWeight: '700', // Bold for emphasis
      color: tokens.foreground,
      letterSpacing: -0.2,
    },
    brandMeta: {
      color: tokens.mutedForeground,
      fontSize: 12, // Secondary size
      marginTop: tokens.spacingXs, // 4px
      lineHeight: 16,
    },
    metaBadge: {
      borderRadius: tokens.radiusFull, // 999
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: tokens.spacingXs, // 4px
      backgroundColor: tokens.surface_container_low,
    },
    metaBadgeLabel: {
      fontSize: 11, // Smaller for better proportion
      fontWeight: '700', // Bold for emphasis
      color: tokens.primary,
      letterSpacing: 0.5,
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacingSm, // 8px
      marginBottom: tokens.spacingLg, // 16px
    },
    metaBlock: {
      flex: 1,
      minWidth: 140,
      backgroundColor: tokens.surface_container_low,
      borderRadius: tokens.radiusSm, // 8px
      padding: tokens.spacingMd, // 12px
    },
    metaLabel: {
      fontSize: 11, // Small size for labels
      fontWeight: '600', // Semi-bold
      color: tokens.mutedForeground,
      marginBottom: tokens.spacingXs, // 4px
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metaValue: {
      fontSize: 14, // Emphasis size
      fontWeight: '600', // Semi-bold
      color: tokens.foreground,
    },
    metaSubValue: {
      fontSize: 12, // Secondary size
      color: tokens.mutedForeground,
      marginTop: tokens.spacingXs, // 4px
    },
    billToRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacingSm, // 8px
      marginBottom: tokens.spacingLg, // 16px
    },
    billToBlock: {
      flex: 1,
      backgroundColor: tokens.surface_container_low,
      borderRadius: tokens.radiusSm, // 8px
      padding: tokens.spacingMd, // 12px
    },
    itemsTable: {
      borderRadius: tokens.radiusSm, // 8px
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.card,
      marginBottom: tokens.spacingLg, // 16px
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: tokens.spacingSm, // 8px
      paddingHorizontal: tokens.spacingMd, // 12px
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    tableHeader: {
      backgroundColor: tokens.surface_container_low,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    headerText: {
      fontWeight: '700', // Bold for emphasis
      color: tokens.foreground,
      fontSize: 12, // Secondary size
      letterSpacing: 0.3,
    },
    colDescription: {
      flex: 2,
      color: tokens.foreground,
      fontSize: 14, // Emphasis size
      fontWeight: '500', // Medium weight
    },
    colQty: {
      flex: 0.5,
      color: tokens.foreground,
      textAlign: 'center',
      fontSize: 14, // Emphasis size
      fontWeight: '500', // Medium weight
    },
    colRate: {
      flex: 1,
      color: tokens.foreground,
      textAlign: 'right',
      fontSize: 14, // Emphasis size
      fontWeight: '500', // Medium weight
    },
    colAmount: {
      flex: 1,
      color: tokens.foreground,
      textAlign: 'right',
      fontSize: 14, // Emphasis size
      fontWeight: '600', // Semi-bold for emphasis
    },
    emptyState: {
      paddingVertical: tokens.spacingXxl, // 32px
      alignItems: 'center',
      backgroundColor: tokens.surface_container_low,
    },
    emptyStateText: {
      color: tokens.mutedForeground,
      fontSize: 14, // Emphasis size
      fontWeight: '600', // Semi-bold
      textAlign: 'center',
    },
    totalCard: {
      borderRadius: tokens.radiusSm, // 8px
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface_container_low,
      padding: tokens.spacingLg, // 16px
      marginBottom: tokens.spacingLg, // 16px
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacingSm, // 8px
    },
    totalLabel: {
      color: tokens.mutedForeground,
      fontSize: 14, // Emphasis size
      fontWeight: '500', // Medium weight
    },
    totalValue: {
      color: tokens.foreground,
      fontWeight: '600', // Semi-bold
      fontSize: 15, // Primary size
    },
    totalLabelBold: {
      color: tokens.foreground,
      fontWeight: '700', // Bold for emphasis
      fontSize: 16, // Primary size
    },
    totalValueBold: {
      color: tokens.primary,
      fontWeight: '700', // Bold for emphasis
      fontSize: 18, // Larger for emphasis
    },
    totalDivider: {
      height: 1,
      backgroundColor: tokens.border,
      marginVertical: tokens.spacingSm, // 8px
    },
    footerNote: {
      backgroundColor: tokens.surface_container_low,
      borderRadius: tokens.radiusSm, // 8px
      padding: tokens.spacingLg, // 16px
    },
    footerNoteTitle: {
      fontWeight: '700', // Bold for emphasis
      color: tokens.foreground,
      fontSize: 14, // Emphasis size
      marginBottom: tokens.spacingXs, // 4px
    },
    footerNoteText: {
      color: tokens.mutedForeground,
      fontSize: 13, // Secondary size
      lineHeight: 18,
    },
  });
