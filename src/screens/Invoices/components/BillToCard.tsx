import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { User, ChevronDown, PlusCircle } from "lucide-react-native";
import { ThemeTokens } from "../../../theme/tokens";

interface BillToCardProps {
  selectedClient?: any;
  onOpenPartySheet: () => void;
  tokens: ThemeTokens;
}

const getInitials = (name?: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
};

export default function BillToCard({
  selectedClient,
  onOpenPartySheet,
  tokens,
}: BillToCardProps) {
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardSectionLabel}>BILL TO</Text>
      <Pressable style={styles.partyRow} onPress={onOpenPartySheet}>
        {selectedClient ? (
          <>
            <View style={styles.partyAvatar}>
              <Text style={styles.partyAvatarText}>
                {getInitials(selectedClient.name)}
              </Text>
            </View>
            <View style={styles.partyInfo}>
              <Text style={styles.partyName}>{selectedClient.name}</Text>
              <Text style={styles.partyMeta}>
                {selectedClient.gstin ??
                  selectedClient.gst_number ??
                  selectedClient.phone ??
                  "Tap to view details"}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.partyAvatar, { backgroundColor: tokens.muted }]}>
              <User size={20} color={tokens.mutedForeground} />
            </View>
            <View style={styles.partyInfo}>
              <Text style={[styles.partyName, { color: tokens.mutedForeground }]}>
                Select Party
              </Text>
              <Text style={styles.partyMeta}>
                Tap to choose customer / vendor
              </Text>
            </View>
          </>
        )}
        <ChevronDown size={20} color={tokens.mutedForeground} />
      </Pressable>
      <Pressable style={styles.editPartyLink} onPress={onOpenPartySheet}>
        <PlusCircle size={14} color={tokens.primary} />
        <Text style={[styles.editPartyText, { marginLeft: 6 }]}>
          {selectedClient ? "Change Party" : "Select Party"}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 24,
      padding: 18,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    cardSectionLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: tokens.mutedForeground,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    partyRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.background,
      borderRadius: 16,
      padding: 14,
    },
    partyAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(29,185,84,0.1)',
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    partyAvatarText: { fontSize: 14, fontWeight: "700", color: tokens.primary },
    partyInfo: { flex: 1 },
    partyName: { fontSize: 15, fontWeight: "700", color: tokens.foreground },
    partyMeta: { fontSize: 11, color: tokens.mutedForeground, marginTop: 2 },
    expandIcon: { fontSize: 18, color: tokens.mutedForeground },
    editPartyLink: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
    },
    editPartyText: { fontSize: 13, fontWeight: "600", color: tokens.primary },
  });
