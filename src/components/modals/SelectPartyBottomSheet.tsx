import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { useThemeTokens } from "../../theme/ThemeProvider";
import { ThemeTokens } from "../../theme/tokens";
import { Party } from "../../types/domain";
import { useParties } from "../../hooks/useParties";
import { Check, ChevronRight, X, Search, Plus } from "lucide-react-native";
import type { AppNavigationParamList } from "../../navigation/types";

type SelectPartyBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelectParty: (party: Party) => void;
  selectedPartyId?: string | null;
  mode?: "sale" | "purchase";
};

const SelectPartyBottomSheet: React.FC<SelectPartyBottomSheetProps> = ({
  visible,
  onClose,
  onSelectParty,
  selectedPartyId,
  mode = "sale",
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: parties = [], isLoading } = useParties();

  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone && p.phone.includes(searchTerm)) ||
      (p.mobile && p.mobile.includes(searchTerm)),
  );

  const handleSelect = useCallback(
    (party: Party) => {
      onSelectParty(party);
      onClose();
    },
    [onSelectParty, onClose],
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("");

  const renderItem = ({ item }: { item: Party }) => {
    const isSelected = item.id === selectedPartyId;
    const initials = getInitials(item.name);
    const subtitle =
      (item as any).gstin ||
      (item as any).gst_number ||
      item.phone ||
      item.mobile ||
      "No contact info";

    return (
      <Pressable
        style={[styles.partyRow, isSelected && styles.partyRowSelected]}
        onPress={() => handleSelect(item)}
        android_ripple={{ color: tokens.primary + "20" }}
      >
        {/* Green left border for selected */}
        {isSelected && <View style={styles.selectedBorder} />}

        <View
          style={[
            styles.avatar,
            {
              backgroundColor: isSelected
                ? tokens.primary
                : tokens.primary + "18",
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: isSelected ? tokens.primaryForeground : tokens.primary },
            ]}
          >
            {initials}
          </Text>
        </View>

        <View style={styles.partyInfo}>
          <Text style={styles.partyName}>{item.name}</Text>
          <Text style={styles.partyMeta}>
            {subtitle.startsWith("07") ||
            subtitle.startsWith("27") ||
            subtitle.length === 15
              ? `GSTIN: ${subtitle}`
              : subtitle}
          </Text>
        </View>

        {isSelected ? (
          <View style={styles.checkCircle}>
            <Check size={16} color={tokens.primaryForeground} strokeWidth={3} />
          </View>
        ) : (
          <ChevronRight size={22} color={tokens.border} />
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayTouchable} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Party</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={20} color={tokens.mutedForeground} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchRow}>
              <Search
                size={18}
                color={tokens.foreground}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or phone..."
                placeholderTextColor={tokens.mutedForeground}
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Party List */}
          {isLoading ? (
            <ActivityIndicator
              color={tokens.primary}
              style={{ marginTop: 24 }}
            />
          ) : (
            <FlatList
              data={filteredParties}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No parties found</Text>
              }
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Sticky CTA */}
          <View style={styles.ctaContainer}>
            <Pressable
              style={styles.createButton}
              onPress={() => {
                onClose();
                navigation.navigate("AddPartySheet", { intent: mode });
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Plus
                  size={16}
                  color={tokens.primaryForeground}
                  strokeWidth={2.5}
                />
                <Text style={styles.createButtonText}>Create New Party</Text>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(25, 28, 31, 0.4)",
    },
    overlayTouchable: {
      flex: 1,
    },
    sheet: {
      backgroundColor: tokens.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "90%",
      shadowColor: "#1a1a2e",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.12,
      shadowRadius: 30,
      elevation: 20,
    },
    dragHandleContainer: {
      alignItems: "center",
      paddingTop: 12,
      paddingBottom: 4,
    },
    dragHandle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: tokens.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: tokens.foreground,
      letterSpacing: -0.5,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: tokens.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    closeIcon: {
      fontSize: 14,
      color: tokens.mutedForeground,
      fontWeight: "600",
    },
    searchContainer: {
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.muted,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    searchIcon: {
      fontSize: 16,
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: tokens.foreground,
    },
    listContent: {
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    partyRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 2,
      borderRadius: 12,
      position: "relative",
    },
    partyRowSelected: {
      backgroundColor: tokens.primary + "0D",
    },
    selectedBorder: {
      position: "absolute",
      left: 0,
      top: 6,
      bottom: 6,
      width: 3,
      borderRadius: 2,
      backgroundColor: tokens.primary,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: "700",
    },
    partyInfo: {
      flex: 1,
    },
    partyName: {
      fontSize: 15,
      fontWeight: "700",
      color: tokens.foreground,
      marginBottom: 2,
    },
    partyMeta: {
      fontSize: 11,
      fontWeight: "500",
      color: tokens.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    checkCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: tokens.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    checkMark: {
      color: tokens.primaryForeground,
      fontSize: 14,
      fontWeight: "700",
    },
    chevron: {
      fontSize: 22,
      color: tokens.border,
      fontWeight: "300",
    },
    emptyText: {
      textAlign: "center",
      color: tokens.mutedForeground,
      marginTop: 32,
      fontSize: 14,
    },
    ctaContainer: {
      padding: 24,
      paddingBottom: 32,
      backgroundColor: tokens.card,
    },
    createButton: {
      backgroundColor: tokens.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    createButtonText: {
      color: tokens.primaryForeground,
      fontSize: 15,
      fontWeight: "700",
    },
  });

export default SelectPartyBottomSheet;
