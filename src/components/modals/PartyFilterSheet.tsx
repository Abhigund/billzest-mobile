import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import ActionSheet from './ActionSheet';
import { Check, X } from 'lucide-react-native';
import Button from '../ui/Button';

interface PartyFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: PartyFilters) => void;
  initialFilters?: PartyFilters;
}

export interface PartyFilters {
  balanceType: 'all' | 'collect' | 'pay' | 'overdue';
  groups: string[];
}

const BALANCE_TYPES = [
  { id: 'collect', label: 'To Collect' },
  { id: 'pay', label: 'To Pay' },
  { id: 'overdue', label: 'Overdue' },
] as const;

const GROUPS = [
  { id: 'general', label: 'General' },
  { id: 'others', label: 'Others' },
];

const PartyFilterSheet: React.FC<PartyFilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);

  const [balanceType, setBalanceType] = useState<PartyFilters['balanceType']>(
    initialFilters?.balanceType || 'all'
  );
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
      initialFilters?.groups || ['general']
  );

  const toggleGroup = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
        setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    } else {
        setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const handleReset = () => {
    setBalanceType('all');
    setSelectedGroups(['general']);
  };

  const handleApply = () => {
    onApply({ balanceType, groups: selectedGroups });
    onClose();
  };

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title="Filter Parties"
      footer={
        <Button
          label="Apply Filters"
          onPress={handleApply}
          variant="primary"
          style={styles.applyButton}
        />
      }
    >
      <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>BALANCE TYPE</Text>
          <TouchableOpacity onPress={handleReset}>
              <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.chipContainer}>
        {BALANCE_TYPES.map(type => {
          const isActive = balanceType === type.id;
          return (
            <Pressable
              key={type.id}
              onPress={() => setBalanceType(isActive ? 'all' : type.id)}
              style={[
                styles.chip,
                isActive && styles.chipActive,
              ]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>PARTY GROUPS</Text>
      <View style={styles.groupList}>
          {GROUPS.map(group => {
              const isSelected = selectedGroups.includes(group.id);
              return (
                  <Pressable 
                    key={group.id} 
                    style={styles.groupRow}
                    onPress={() => toggleGroup(group.id)}
                  >
                      <Text style={styles.groupLabel}>{group.label}</Text>
                      <View style={[
                          styles.checkbox, 
                          isSelected && styles.checkboxActive
                      ]}>
                          {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                      </View>
                  </Pressable>
              );
          })}
      </View>
    </ActionSheet>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.mutedForeground,
      letterSpacing: 0.5,
    },
    clearText: {
        fontSize: 14,
        color: tokens.primary,
        fontWeight: '600',
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: tokens.muted,
      margin: 4,
    },
    chipActive: {
      backgroundColor: tokens.primary,
    },
    chipText: {
      color: tokens.foreground,
      fontWeight: '600',
      fontSize: 14,
    },
    chipTextActive: {
      color: '#fff',
    },
    groupList: {
        marginTop: 12,
        backgroundColor: tokens.muted,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    groupRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    groupLabel: {
        fontSize: 16,
        color: tokens.foreground,
        fontWeight: '500',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: tokens.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: tokens.primary,
        borderColor: tokens.primary,
    },
    applyButton: {
        width: '100%',
        borderRadius: 16,
        height: 52,
    },
  });

export default PartyFilterSheet;
