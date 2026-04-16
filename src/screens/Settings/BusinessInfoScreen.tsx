import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Building2, Phone, MapPin, Edit3, X, ShieldCheck } from 'lucide-react-native';
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
      <DetailHeader
        title="Business Information"
        actions={
          !isEditing
            ? [
                {
                  icon: <Edit3 color={tokens.primary} size={18} />,
                  onPress: () => setIsEditing(true),
                  accessibilityLabel: 'Edit business information',
                },
              ]
            : [
                {
                  icon: <X color={tokens.destructive} size={18} />,
                  onPress: handleCancel,
                  accessibilityLabel: 'Cancel editing',
                },
              ]
        }
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page intro ─────────────────────────────────────────────── */}
        <View style={styles.intro}>
          <View style={styles.introBadge}>
            <Building2 color={tokens.primary} size={20} />
          </View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>Store Profile</Text>
            <Text style={styles.introSub}>
              Used on invoices, GST filings & store identity
            </Text>
          </View>
        </View>

        {/* ── Identity card ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>IDENTITY</Text>

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
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Store Name</Text>
                <Text style={styles.infoValue}>{storeName || 'Not set'}</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <View style={styles.infoLabelRow}>
                  <View style={styles.infoLabelIcon}>
                    <ShieldCheck size={12} color={tokens.mutedForeground} />
                  </View>
                  <Text style={styles.infoLabel}>GSTIN</Text>
                </View>
                <Text style={[styles.infoValue, !gstNumber && styles.infoValueMuted]}>
                  {gstNumber || 'Not set'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── Contact card ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>CONTACT & LOCATION</Text>

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
                <View style={styles.contactIconWrap}>
                  <Phone color={tokens.primary} size={15} />
                </View>
                <View style={styles.contactCopy}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={[styles.infoValue, !phone && styles.infoValueMuted]}>
                    {phone || 'Not set'}
                  </Text>
                </View>
              </View>
              <View style={[styles.contactRow, styles.contactRowLast]}>
                <View style={styles.contactIconWrap}>
                  <MapPin color={tokens.primary} size={15} />
                </View>
                <View style={styles.contactCopy}>
                  <Text style={styles.infoLabel}>Store Address</Text>
                  <Text style={[styles.infoValue, !address && styles.infoValueMuted]}>
                    {address || 'Not set'}
                  </Text>
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
    content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 60 },

    // ── Intro block ──────────────────────────────────────────────────────
    intro: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    introBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: tokens.primaryAlpha15,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    introCopy: { flex: 1 },
    introTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
    },
    introSub: {
      fontSize: 12,
      color: tokens.mutedForeground,
      marginTop: 3,
    },

    // ── Card ─────────────────────────────────────────────────────────────
    card: {
      backgroundColor: tokens.card,
      borderRadius: 20,
      marginBottom: 16,
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
      overflow: 'hidden',
      paddingBottom: 4,
    },
    cardSectionLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: tokens.mutedForeground,
      letterSpacing: 1,
      textTransform: 'uppercase',
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 10,
    },

    // ── Info rows (view mode) ─────────────────────────────────────────────
    infoRow: {
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.surface_container_low,
    },
    infoRowLast: {
      borderBottomWidth: 0,
      marginBottom: 4,
    },
    infoLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoLabelIcon: {
      marginRight: 4,
      justifyContent: 'center',
    },
    infoLabel: {
      fontSize: 11,
      color: tokens.mutedForeground,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.foreground,
      marginTop: 3,
    },
    infoValueMuted: {
      color: tokens.mutedForeground,
      fontWeight: '400',
    },

    // ── Contact rows (view mode) ──────────────────────────────────────────
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.surface_container_low,
    },
    contactRowLast: {
      borderBottomWidth: 0,
      marginBottom: 4,
    },
    contactIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: tokens.primaryAlpha10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
    },
    contactCopy: { flex: 1 },

    // ── Edit form ─────────────────────────────────────────────────────────
    field: { marginHorizontal: 14, marginBottom: 12 },
    actions: { marginTop: 8 },

    // ── Loading ───────────────────────────────────────────────────────────
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
  });

export default BusinessInfoScreen;
