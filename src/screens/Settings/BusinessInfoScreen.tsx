import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Building2, Phone, MapPin, Edit3, X } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import DetailHeader from '../../components/DetailHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { organizationService } from '../../supabase/organizationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Organization } from '../../types/domain';

const BusinessInfoScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const queryClient = useQueryClient();
  const { organization, organizationId } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with fetched data
  useEffect(() => {
    if (organization) {
      setStoreName(organization.name || '');
      setGstNumber(organization.gst_number || '');
      setPhone(organization.business_phone || '');
      setAddress(organization.business_address || '');
    }
  }, [organization]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (
      updates: Partial<Omit<Organization, 'id' | 'owner_id' | 'created_at'>>,
    ) => {
      if (!organizationId) throw new Error('No organization context');
      return organizationService.updateOrganization(organizationId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      // In a real app we might also need to refresh the OrganizationContext here
      // But we will optimize and assume context handles its own refetch if necessary
      Alert.alert('Success', 'Business information saved successfully.');
      setIsEditing(false);
      setErrors({});
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.message ||
          'Failed to save business information. Please try again.',
      );
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    }

    if (
      gstNumber.trim() &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(
        gstNumber.trim(),
      )
    ) {
      newErrors.gstNumber = 'Invalid GSTIN format';
    }

    if (
      phone.trim() &&
      !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
        phone.trim(),
      )
    ) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const updates = {
      name: storeName.trim() || 'My Business',
      gst_number: gstNumber.trim() || null,
      business_phone: phone.trim() || null,
      business_address: address.trim() || null,
    };

    saveMutation.mutate(updates);
  };

  const handleCancel = () => {
    // Reset to original values
    if (organization) {
      setStoreName(organization.name || '');
      setGstNumber(organization.gst_number || '');
      setPhone(organization.business_phone || '');
      setAddress(organization.business_address || '');
    }
    setIsEditing(false);
    setErrors({});
  };

  if (!organizationId || !organization) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.primary} size="large" />
          <Text style={styles.loadingText}>
            Loading business information...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <DetailHeader title="Business Information" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Building2 color={tokens.primary} size={22} />
          </View>
          <Text style={styles.subtitle}>
            Keep your billing details accurate for invoices, GST filings, and
            customer trust.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Store Profile</Text>
            {!isEditing ? (
              <Pressable
                style={styles.inlineAction}
                onPress={() => setIsEditing(true)}
              >
                <Edit3 color={tokens.primary} size={16} />
                <Text style={styles.inlineActionLabel}>Edit</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.inlineAction} onPress={handleCancel}>
                <X color={tokens.destructive} size={16} />
                <Text
                  style={[
                    styles.inlineActionLabel,
                    { color: tokens.destructive },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>
            )}
          </View>

          {isEditing ? (
            <>
              <Input
                label="Store Name"
                value={storeName}
                onChangeText={text => {
                  setStoreName(text);
                  if (errors.storeName) {
                    setErrors(prev => ({ ...prev, storeName: '' }));
                  }
                }}
                placeholder="Enter store name"
                containerStyle={styles.field}
                error={errors.storeName}
              />
              <Input
                label="GSTIN"
                value={gstNumber}
                onChangeText={text => {
                  setGstNumber(text);
                  if (errors.gstNumber) {
                    setErrors(prev => ({ ...prev, gstNumber: '' }));
                  }
                }}
                placeholder="27ABCDE1234F1Z5"
                containerStyle={styles.field}
                error={errors.gstNumber}
              />
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Store Name</Text>
                <Text style={styles.rowValue}>{storeName || 'Not set'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>GSTIN</Text>
                <Text style={styles.rowValue}>{gstNumber || 'Not set'}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact & Branch</Text>
          {isEditing ? (
            <>
              <Input
                label="Phone Number"
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                  if (errors.phone) {
                    setErrors(prev => ({ ...prev, phone: '' }));
                  }
                }}
                placeholder="+91 99887 66554"
                keyboardType="phone-pad"
                containerStyle={styles.field}
                error={errors.phone}
              />
              <Input
                label="Store Address"
                value={address}
                onChangeText={setAddress}
                placeholder="Enter complete address"
                multiline
                numberOfLines={3}
                containerStyle={styles.field}
              />
            </>
          ) : (
            <>
              <View style={styles.contactRow}>
                <View style={styles.leadingIcon}>
                  <Phone color={tokens.primary} size={16} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowLabel}>Phone Number</Text>
                  <Text style={styles.rowValue}>{phone || 'Not set'}</Text>
                </View>
              </View>
              <View style={styles.contactRow}>
                <View style={styles.leadingIcon}>
                  <MapPin color={tokens.primary} size={16} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowLabel}>Store Address</Text>
                  <Text style={styles.rowValue}>{address || 'Not set'}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {isEditing && (
          <View style={styles.actions}>
            <Button
              label={saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              fullWidth
              onPress={handleSave}
              disabled={saveMutation.isPending}
              loading={saveMutation.isPending}
            />
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 80 },
    header: { marginBottom: 16 },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tokens.primaryAlpha20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    subtitle: { color: tokens.mutedForeground, marginTop: 6 },
    card: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: tokens.foreground },
    row: { marginBottom: 12 },
    rowLabel: { color: tokens.mutedForeground, fontSize: 13 },
    rowValue: { color: tokens.foreground, fontWeight: '600', marginTop: 4 },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    leadingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: tokens.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rowCopy: { flex: 1 },
    complianceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
    },
    inlineAction: { flexDirection: 'row', alignItems: 'center' },
    inlineActionLabel: {
      color: tokens.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    inlineButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    actions: { marginTop: 8 },
    secondaryCta: { marginTop: 12 },
    field: { marginBottom: 16 },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      color: tokens.mutedForeground,
      fontSize: 14,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: tokens.foreground,
      marginBottom: 8,
    },
    errorText: {
      color: tokens.mutedForeground,
      textAlign: 'center',
      fontSize: 14,
    },
  });

export default BusinessInfoScreen;
