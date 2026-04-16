import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import ScreenWrapper from '../../components/ScreenWrapper';
import Input from '../../components/ui/Input';
import { X, Calendar, ChevronDown, CheckCircle2 } from 'lucide-react-native';
import FormActionBar from '../../components/ui/FormActionBar';
import { useAddCreditTransaction } from '../../hooks/useCredit';
import ClientSelectionSheet from '../../components/modals/ClientSelectionSheet';
import { Party } from '../../types/domain';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { AppNavigationParamList } from '../../navigation/types';

const AddCreditTransactionSheet: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NavigationProp<AppNavigationParamList>>();
  const route =
    useRoute<RouteProp<AppNavigationParamList, 'AddCreditTransactionSheet'>>();

  // Pre-fill party if passed from Ledger screen
  const prefilledParty = route.params?.party;

  // Form State
  const [selectedParty, setSelectedParty] = useState<Party | null>(prefilledParty || null);
  const [partySelectorVisible, setPartySelectorVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'received' | 'given'>('received');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  const addTransaction = useAddCreditTransaction();

  const handleSubmit = async () => {
    if (!selectedParty) {
      Alert.alert('Validation Error', 'Please select a party.');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      await addTransaction.mutateAsync({
        party_id: selectedParty.id,
        amount: Number(amount),
        type,
        date: date.toISOString(),
        description: description.trim() || null,
      });

      Alert.alert('Success', 'Transaction recorded successfully!');
      navigation.goBack();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save transaction';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Add Transaction</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close"
            accessibilityRole="button"
            style={{ padding: 8 }}
          >
            <X color={tokens.foreground} size={24} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Record a payment received or credit given manually.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Type Selection */}
        <View style={styles.typeContainer}>
          <TypeButton
            label="Received (In)"
            isActive={type === 'received'}
            type="received"
            onPress={() => setType('received')}
            tokens={tokens}
            styles={styles}
          />
          <TypeButton
            label="Given (Out)"
            isActive={type === 'given'}
            type="given"
            onPress={() => setType('given')}
            tokens={tokens}
            styles={styles}
          />
        </View>

        {/* Party Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Party</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => {
              if (prefilledParty) return;
              setPartySelectorVisible(true);
            }}
            disabled={!!prefilledParty}
          >
            <Text
              style={[
                styles.selectText,
                selectedParty
                  ? { color: tokens.foreground }
                  : { color: tokens.mutedForeground },
              ]}
            >
              {selectedParty?.name || 'Select Customer or Vendor'}
            </Text>
            {!prefilledParty && (
              <ChevronDown size={20} color={tokens.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>

        <Input
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          containerStyle={styles.input}
        />

        {/* Date Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: tokens.foreground }}>
              {date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
            <Calendar size={20} color={tokens.mutedForeground} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <Input
          label="Description (Optional)"
          placeholder="e.g., Payment for Invoice #101"
          value={description}
          onChangeText={setDescription}
          containerStyle={styles.input}
        />

        <Input
          label="Reference / Check No. (Optional)"
          placeholder="e.g., UPI-123456"
          value={reference}
          onChangeText={setReference}
          containerStyle={styles.input}
        />
      </ScrollView>

      <FormActionBar
        variant="dual"
        secondaryLabel="Cancel"
        secondaryIcon={<X size={16} color={tokens.mutedForeground} />}
        onSecondary={() => navigation.goBack()}
        primaryLabel={loading ? 'Saving...' : 'Save Transaction'}
        primaryIcon={<CheckCircle2 size={16} color={tokens.primaryForeground} />}
        onPrimary={handleSubmit}
        loading={loading}
        disabled={loading}
        primaryDestructive={type === 'given'}
      />

      <ClientSelectionSheet
        visible={partySelectorVisible}
        onClose={() => setPartySelectorVisible(false)}
        onSelectClient={(party) => {
          setSelectedParty(party);
          setPartySelectorVisible(false);
        }}
      />
    </ScreenWrapper>
  );
};

// Helper Component for Type Selection
const TypeButton = ({
  label,
  isActive,
  type,
  onPress,
  tokens,
  styles,
}: {
  label: string;
  isActive: boolean;
  type: 'received' | 'given';
  onPress: () => void;
  tokens: ThemeTokens;
  styles: any;
}) => {
  const activeBg = type === 'received' ? tokens.primary : tokens.destructive;

  return (
    <TouchableOpacity
      style={[
        styles.typeButton,
        isActive
          ? { backgroundColor: activeBg, borderColor: activeBg }
          : { backgroundColor: tokens.card, borderColor: tokens.border },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.typeButtonText,
          isActive
            ? { color: tokens.primaryForeground }
            : { color: tokens.foreground },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    header: {
      padding: 20,
      paddingBottom: 10,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: tokens.foreground,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      color: tokens.mutedForeground,
    },
    content: {
      padding: 20,
    },
    typeContainer: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 12,
    },
    typeButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      // No-Line Rule: active state uses full bg colour; inactive uses tonal surface
      justifyContent: 'center',
      alignItems: 'center',
    },
    typeButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: tokens.foreground,
      marginBottom: 8,
    },
    selectInput: {
      height: 50,
      backgroundColor: tokens.surface_container_low,
      borderRadius: 12,
      // No-Line Rule: tonal surface replaces 1px border
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    selectText: {
      fontSize: 16,
    },
    input: {
      marginBottom: 20,
    },
  });

export default AddCreditTransactionSheet;
