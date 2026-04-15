import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomersStackParamList } from '../../navigation/types';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { X } from 'lucide-react-native';
import { partiesService } from '../../supabase/partiesService';
import { useQueryClient } from '@tanstack/react-query';
import { Party } from '../../types/domain';
import { useOrganization } from '../../contexts/OrganizationContext';
import { PARTY_QUERY_KEYS } from '../../logic/partyLogic';

type AddPartySheetRoute = RouteProp<
  {
    AddPartySheet: {
      intent?: 'purchase' | 'sale';
      createdParty?: Party;
    };
  },
  'AddPartySheet'
>;

const AddPartySheet: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const route = useRoute<AddPartySheetRoute>();
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  // Determine initial type based on route params
  const getInitialType = (): 'customer' | 'vendor' | 'expense' => {
    if (route.params?.intent === 'purchase') {
      return 'vendor';
    }
    return 'customer';
  };

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'customer' | 'vendor' | 'expense'>(
    getInitialType(),
  );
  const [loading, setLoading] = useState(false);

  // Update type when route params change
  useEffect(() => {
    const initialType = getInitialType();
    setType(initialType);
  }, [route.params?.intent]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a name.');
      return;
    }

    if (type !== 'expense') {
      if (!mobile.trim()) {
        Alert.alert('Validation Error', 'Please enter a mobile number.');
        return;
      }

      // Validate phone format
      const { validators } = require('../../utils/validators');
      const phoneError = validators.phone(mobile);
      if (phoneError) {
        Alert.alert('Validation Error', phoneError);
        return;
      }
    }

    // Validate email format if provided
    if (email.trim()) {
      const { validators } = require('../../utils/validators');
      const emailError = validators.email(email);
      if (emailError) {
        Alert.alert('Validation Error', emailError);
        return;
      }
    }

    setLoading(true);
    try {
      const createdParty = await partiesService.createParty(organizationId!, {
        name: name.trim(),
        type: type, // This handles V2 type enum
        party_type: type, // Legacy compat just in case
        mobile: mobile.trim() || null,
        email: email.trim() || null,
        phone: null,
        address: null,
        notes: null,
        balance: 0,
      });

      // Invalidate parties query to refresh the list
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: PARTY_QUERY_KEYS.all(organizationId),
        });
      }

      Alert.alert(
        'Success',
        `${
          type === 'expense' ? 'Expense Category' : 'Party'
        } added successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error: any) {
      if (error.code === 'conflict' && error.details?.existingId) {
        Alert.alert(
          'Party Already Exists',
          error.message,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'View Existing', 
              onPress: () => {
                // Navigate to the detail view. Note: screen name usually 'CustomerDetail' across stacks
                navigation.navigate('CustomerDetail', { customerId: error.details.existingId });
              } 
            }
          ]
        );
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to add party. Please try again.';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Add New Party</Text>
          <Button
            variant="ghost"
            size="icon"
            onPress={() => navigation.goBack()}
            icon={<X color={tokens.foreground} size={24} />}
          />
        </View>
        <Text style={styles.subtitle}>
          Add a customer, vendor, or expense category to your credit book.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Type Selection */}
        <View style={styles.typeContainer}>
          <TypeButton
            label="Customer"
            isActive={type === 'customer'}
            onPress={() => setType('customer')}
            tokens={tokens}
            styles={styles}
          />
          <TypeButton
            label="Vendor"
            isActive={type === 'vendor'}
            onPress={() => setType('vendor')}
            tokens={tokens}
            styles={styles}
          />
          <TypeButton
            label="Expense"
            isActive={type === 'expense'}
            onPress={() => setType('expense')}
            tokens={tokens}
            styles={styles}
          />
        </View>

        <Input
          label="Name"
          placeholder={
            type === 'expense' ? 'e.g., Electricity, Rent' : 'Enter party name'
          }
          value={name}
          onChangeText={setName}
          containerStyle={styles.input}
        />

        {type !== 'expense' && (
          <>
            <Input
              label="Mobile Number"
              placeholder="Enter 10-digit mobile number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              maxLength={10}
              containerStyle={styles.input}
            />
            <Input
              label="Email (Optional)"
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              containerStyle={styles.input}
            />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={loading ? 'Adding...' : 'Add Party'}
          onPress={handleSubmit}
          disabled={loading}
          fullWidth
        />
      </View>
    </ScreenWrapper>
  );
};

// Helper Component for Type Selection
const TypeButton = ({
  label,
  isActive,
  onPress,
  tokens,
  styles,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  tokens: ThemeTokens;
  styles: any;
}) => (
  <View style={[styles.typeButtonWrapper]}>
    <Button
      label={label}
      onPress={onPress}
      variant={isActive ? 'primary' : 'outline'}
      style={[
        styles.typeButton,
        isActive
          ? { backgroundColor: tokens.primary }
          : { backgroundColor: tokens.card, borderColor: tokens.border },
      ]}
      labelStyle={
        isActive
          ? { color: tokens.primaryForeground }
          : { color: tokens.foreground }
      }
    />
  </View>
);

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
      gap: 10,
    },
    typeButtonWrapper: {
      flex: 1,
    },
    typeButton: {
      height: 40,
      borderRadius: 8,
    },
    input: {
      marginBottom: 20,
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      backgroundColor: tokens.background,
    },
  });

export default AddPartySheet;
