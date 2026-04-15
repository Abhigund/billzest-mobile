import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import ActionSheet from './ActionSheet';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { Check } from 'lucide-react-native';
import Button from '../ui/Button';

export type FilterOption = {
  id: string;
  label: string;
};

export type FilterSectionMode = 'single' | 'multi';

export type FilterSection = {
  key: string;
  title: string;
  options: FilterOption[];
  mode: FilterSectionMode;
};

export type FilterValues = Record<string, string | string[]>;

type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  sections: FilterSection[];
  initialValues?: FilterValues;
  onApply: (values: FilterValues) => void;
};

const buildDefaults = (sections: FilterSection[]): FilterValues => {
  const defaults: FilterValues = {};
  for (const section of sections) {
    if (section.mode === 'single') {
      defaults[section.key] = section.options[0]?.id ?? '';
    } else {
      defaults[section.key] = [];
    }
  }
  return defaults;
};

const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  title = 'Filter By',
  sections,
  initialValues,
  onApply,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  const [values, setValues] = useState<FilterValues>(() => ({
    ...buildDefaults(sections),
    ...initialValues,
  }));

  useEffect(() => {
    setValues({ ...buildDefaults(sections), ...initialValues });
  }, [initialValues, sections]);

  const handleSingleSelect = (key: string, id: string) => {
    setValues(prev => ({ ...prev, [key]: id }));
  };

  const handleMultiToggle = (key: string, id: string) => {
    setValues(prev => {
      const current = (prev[key] as string[]) ?? [];
      const next = current.includes(id)
        ? current.filter(v => v !== id)
        : [...current, id];
      return { ...prev, [key]: next };
    });
  };

  const handleReset = () => {
    setValues(buildDefaults(sections));
  };

  const handleApply = () => {
    onApply(values);
    onClose();
  };

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={
        <View style={styles.footerRow}>
          <Button
            label="Cancel"
            variant="ghost"
            onPress={onClose}
            style={styles.footerBtn}
          />
          <Button
            label="Apply"
            variant="primary"
            onPress={handleApply}
            style={styles.footerBtn}
          />
        </View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sections.map((section, sectionIndex) => {
          const isLast = sectionIndex === sections.length - 1;
          return (
            <View key={section.key} style={[styles.section, isLast && styles.sectionLast]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
                {sectionIndex === 0 && (
                  <TouchableOpacity onPress={handleReset} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.clearText}>Clear all</Text>
                  </TouchableOpacity>
                )}
              </View>

              {section.mode === 'single' ? (
                <View style={styles.chipRow}>
                  {section.options.map(option => {
                    const isActive = values[section.key] === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => handleSingleSelect(section.key, option.id)}
                        accessibilityLabel={option.label}
                      >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.checkList}>
                  {section.options.map(option => {
                    const selected = (values[section.key] as string[])?.includes(option.id);
                    return (
                      <Pressable
                        key={option.id}
                        style={styles.checkRow}
                        onPress={() => handleMultiToggle(section.key, option.id)}
                        accessibilityLabel={option.label}
                      >
                        <Text style={styles.checkLabel}>{option.label}</Text>
                        <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                          {selected && <Check size={13} color={tokens.primaryForeground} strokeWidth={3} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ActionSheet>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: 8,
    },
    section: {
      marginBottom: 20,
    },
    sectionLast: {
      marginBottom: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.mutedForeground,
      letterSpacing: 0.6,
    },
    clearText: {
      fontSize: 13,
      fontWeight: '600',
      color: tokens.primary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: tokens.muted,
    },
    chipActive: {
      backgroundColor: tokens.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.foreground,
    },
    chipTextActive: {
      color: tokens.primaryForeground,
    },
    checkList: {
      backgroundColor: tokens.muted,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    checkRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    checkLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: tokens.foreground,
    },
    checkbox: {
      width: 22,
      height: 22,
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
    footerRow: {
      flexDirection: 'row',
      gap: 12,
    },
    footerBtn: {
      flex: 1,
      height: 52,
      borderRadius: 16,
    },
  });

export default FilterSheet;
