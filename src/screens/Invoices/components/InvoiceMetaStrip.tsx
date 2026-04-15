import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Edit2 } from "lucide-react-native";
import { ThemeTokens } from "../../../theme/tokens";

interface InvoiceMetaStripProps {
  isEditMode: boolean;
  invoiceId?: string;
  invoiceDate: string | Date;
  tokens: ThemeTokens;
}

export default function InvoiceMetaStrip({
  isEditMode,
  invoiceId,
  invoiceDate,
  tokens,
}: InvoiceMetaStripProps) {
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.metaStrip}>
      <View>
        <Text style={styles.metaInvoiceNo}>
          INVOICE #{isEditMode ? (invoiceId?.slice(-4) ?? "—") : "NEW"}
        </Text>
        <Text style={styles.metaDate}>
          {new Date(invoiceDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          • Due: 7 days
        </Text>
      </View>
      <Pressable style={styles.metaEditBtn} onPress={() => {}}>
        <Text style={styles.metaEditText}>EDIT </Text>
        <Edit2 size={12} color={tokens.primary} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    metaStrip: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    metaInvoiceNo: {
      fontSize: 11,
      fontWeight: "700",
      color: tokens.mutedForeground,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    metaDate: { fontSize: 11, color: tokens.mutedForeground, marginTop: 2 },
    metaEditBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(29,185,84,0.35)',
      backgroundColor: 'rgba(29,185,84,0.05)',
    },
    metaEditText: { fontSize: 11, fontWeight: "700", color: tokens.primary },
  });
