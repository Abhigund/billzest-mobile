import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import {
  ChevronLeft,
  MoreVertical,
  CheckCircle2,
  X,
  Wallet,
  MapPin,
  Info,
} from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useClientMutations } from '../../logic/partyLogic';
import { partiesService } from '../../supabase/partiesService';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Party } from '../../types/domain';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomersStackParamList } from '../../navigation/types';
import TonalInput from '../../components/ui/TonalInput';

type PartyFormState = {
  businessName: string;
  phone: string;
  email: string;
  gstin: string;
  openingBalance: string;
  balanceType: 'RECEIVABLE' | 'PAYABLE';
  creditLimit: string;
  isCreditEnabled: boolean;
  address: string;
  type: 'customer' | 'vendor';
};

type CustomerFormRoute = RouteProp<CustomersStackParamList, 'CustomerForm'>;

const CustomerFormScreen = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const route = useRoute<CustomerFormRoute>();
  const { createClient, updateClient } = useClientMutations();
  const { organizationId } = useOrganization();
  const customerId = route.params?.customerId;
  const isEditMode = !!customerId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(isEditMode);
  const [formState, setFormState] = useState<PartyFormState>({
    businessName: '',
    phone: '',
    email: '',
    gstin: '',
    openingBalance: '',
    balanceType: 'RECEIVABLE',
    creditLimit: '',
    isCreditEnabled: false,
    address: '',
    type: 'customer',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const loadCustomer = async () => {
      if (!customerId) {
        setIsLoadingCustomer(false);
        return;
      }

      try {
        const customer = await partiesService.getPartyById(customerId);
        if (!isMounted) return;

        if (!customer) {
          Alert.alert('Not found', 'Party record could not be loaded.');
          navigation.goBack();
          return;
        }

        const balance = customer.balance ?? 0;
        setFormState({
          businessName: customer.name ?? '',
          phone: customer.mobile ?? customer.phone ?? '',
          email: customer.email ?? '',
          gstin: customer.gst_number ?? '',
          openingBalance: Math.abs(balance).toString(),
          balanceType: balance >= 0 ? 'RECEIVABLE' : 'PAYABLE',
          creditLimit: (customer.credit_limit ?? '').toString(),
          isCreditEnabled: customer.credit_limit_enabled ?? false,
          address: customer.address ?? '',
          type: customer.type === 'vendor' ? 'vendor' : 'customer',
        });
      } catch (error) {
        if (!isMounted) return;
        Alert.alert('Load failed', 'Unable to load party details.');
        navigation.goBack();
      } finally {
        if (isMounted) setIsLoadingCustomer(false);
      }
    };

    loadCustomer();
    return () => { isMounted = false; };
  }, [customerId, navigation]);

  const handleChange = (field: keyof PartyFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.businessName.trim()) newErrors.businessName = 'Name is required';
    if (!formState.phone.trim()) newErrors.phone = 'Phone is required';
    else if (formState.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'Enter a valid 10-digit number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (isSubmitting || isLoadingCustomer) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    const phoneNormalized = formState.phone.replace(/\D/g, '').trim();

    try {
      if (!isEditMode) {
        const existing = await partiesService.findPartyByPhone(organizationId!, phoneNormalized);
        if (existing) {
          Alert.alert('Duplicate Party', 'A party with this phone already exists.');
          setIsSubmitting(false);
          return;
        }
      }

      const balanceValue = parseFloat(formState.openingBalance) || 0;
      const finalBalance = formState.balanceType === 'RECEIVABLE' ? balanceValue : -balanceValue;

      const payload: Partial<Party> = {
        name: formState.businessName.trim(),
        mobile: phoneNormalized,
        phone: phoneNormalized,
        email: formState.email.trim() || null,
        gst_number: formState.gstin.trim() || null,
        balance: finalBalance,
        credit_limit: parseFloat(formState.creditLimit) || 0,
        credit_limit_enabled: formState.isCreditEnabled,
        address: formState.address.trim() || null,
        type: formState.type,
      };

      if (isEditMode && customerId) {
        await updateClient.mutateAsync({ id: customerId, updates: payload });
      } else {
        await createClient.mutateAsync({ ...payload, organization_id: organizationId! } as any);
      }

      navigation.goBack();
    } catch (err) {
      Alert.alert('Save failed', 'Unable to save party.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ChevronLeft color={tokens.foreground} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Party' : 'Add Party'}</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <MoreVertical color={tokens.foreground} size={20} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>BASIC INFO</Text>
                <View style={[styles.sectionIndicator, { backgroundColor: tokens.primary }]} />
              </View>
              <Info size={14} color={tokens.mutedForeground} />
            </View>

            <TonalInput
              label="Party Name *"
              placeholder="Enter party name"
              value={formState.businessName}
              onChangeText={val => handleChange('businessName', val)}
              error={errors.businessName}
            />

            <TonalInput
              label="Phone *"
              placeholder="Mobile number"
              prefix="+91"
              keyboardType="number-pad"
              maxLength={10}
              value={formState.phone}
              onChangeText={val => handleChange('phone', val)}
              error={errors.phone}
            />

            <View style={styles.row}>
              <TonalInput
                label="Email"
                placeholder="Optional"
                keyboardType="email-address"
                value={formState.email}
                onChangeText={val => handleChange('email', val)}
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <TonalInput
                label="GSTIN"
                placeholder="22AAAAA0000A1Z5"
                autoCapitalize="characters"
                value={formState.gstin}
                onChangeText={val => handleChange('gstin', val)}
                containerStyle={{ flex: 1 }}
              />
            </View>
          </View>

          {/* Financial Setup Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>FINANCIAL SETUP</Text>
                <Wallet size={14} color={tokens.primary} style={{ marginLeft: 8 }} />
              </View>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.inputLabel}>Opening Balance</Text>
              <View style={styles.balanceInputRow}>
                <TonalInput
                  label=""
                  placeholder="₹ 0.00"
                  keyboardType="numeric"
                  value={formState.openingBalance}
                  onChangeText={val => handleChange('openingBalance', val)}
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                  inputStyle={styles.hugeInput}
                />
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      formState.balanceType === 'RECEIVABLE' && styles.toggleBtnActive,
                    ]}
                    onPress={() => handleChange('balanceType', 'RECEIVABLE')}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        formState.balanceType === 'RECEIVABLE' && styles.toggleBtnTextActive,
                      ]}
                    >
                      YOU&apos;LL GET
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      formState.balanceType === 'PAYABLE' && [styles.toggleBtnActive, { backgroundColor: tokens.destructive }],
                    ]}
                    onPress={() => handleChange('balanceType', 'PAYABLE')}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        formState.balanceType === 'PAYABLE' && styles.toggleBtnTextActive,
                      ]}
                    >
                      YOU&apos;LL GIVE
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Enable Credit Limit</Text>
                <Text style={styles.switchSublabel}>Control exposure for this party</Text>
              </View>
              <Switch
                value={formState.isCreditEnabled}
                onValueChange={val => handleChange('isCreditEnabled', val)}
                trackColor={{ false: tokens.muted, true: tokens.primary }}
              />
            </View>

            {formState.isCreditEnabled && (
              <TonalInput
                label="Credit Limit Amount"
                placeholder="Set limit"
                keyboardType="numeric"
                value={formState.creditLimit}
                onChangeText={val => handleChange('creditLimit', val)}
              />
            )}
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>LOCATION & LOGISTICS</Text>
                <MapPin size={14} color={tokens.primary} style={{ marginLeft: 8 }} />
              </View>
            </View>

            <TonalInput
              label="Billing Address"
              placeholder="Street name, building, area..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              inputStyle={{ minHeight: 80 }}
              value={formState.address}
              onChangeText={val => handleChange('address', val)}
            />
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.discardBtn} 
            onPress={() => navigation.goBack()}
          >
            <X size={20} color={tokens.mutedForeground} />
            <Text style={styles.discardBtnText}>DISCARD</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <CheckCircle2 size={20} color="#fff" />
            <Text style={styles.saveBtnText}>SAVE PARTY</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: tokens.background,
    },
    headerBtn: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: tokens.foreground,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      backgroundColor: tokens.surface_container_lowest,
      borderRadius: 24,
      padding: 12,
      marginBottom: 12,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 12,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.secondary,
      letterSpacing: 1.5,
    },
    sectionIndicator: {
      height: 4,
      width: 48,
      borderRadius: 2,
      marginLeft: 12,
    },
    row: {
      flexDirection: 'row',
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.mutedForeground,
      marginBottom: 4,
      marginLeft: 4,
    },
    balanceContainer: {
      marginBottom: 14,
    },
    balanceInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.secondary,
      borderRadius: 20,
      padding: 6,
    },
    hugeInput: {
      fontSize: 20,
      fontWeight: '800',
      paddingVertical: 8,
    },
    toggleGroup: {
      flexDirection: 'row',
      backgroundColor: tokens.background,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: tokens.secondary,
    },
    toggleBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    toggleBtnActive: {
      backgroundColor: tokens.primary,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    toggleBtnText: {
      fontSize: 9,
      fontWeight: '800',
      color: tokens.mutedForeground,
    },
    toggleBtnTextActive: {
      color: '#fff',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      marginBottom: 4,
    },
    switchLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: tokens.foreground,
    },
    switchSublabel: {
      fontSize: 10,
      fontWeight: '500',
      color: tokens.mutedForeground,
      marginTop: 2,
    },
    actionBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderTopWidth: 1,
      borderTopColor: 'rgba(188, 203, 185, 0.15)',
    },
    discardBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    discardBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.mutedForeground,
      marginLeft: 8,
      letterSpacing: 1,
    },
    saveBtn: {
      flex: 1.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.primary,
      borderRadius: 14,
      paddingVertical: 14,
      marginLeft: 12,
      shadowColor: tokens.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 6,
    },
    saveBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
      marginLeft: 8,
      letterSpacing: 1,
    },
  });

export default CustomerFormScreen;
