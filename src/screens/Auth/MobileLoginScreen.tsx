import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';
import type { DashboardStackParamList } from '../../navigation/types';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const { width, height } = Dimensions.get('window');

const MobileLoginScreen = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = () => {
    if (mobileNumber.length >= 10) {
      setLoading(true);
      navigation.navigate('VerifyOTP', { mobileNumber });
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.arcBackground} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <CheckCircle2 color={tokens.primary} size={32} fill={tokens.primary} style={styles.checkIcon} />
              <Text style={styles.logoTextPrimary}>
                BILL<Text style={styles.logoTextZest}>ZEST</Text>
              </Text>
            </View>
            <Text style={styles.tagline}>Smart billing for Indian businesses</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.subtitleText}>Enter your mobile number to continue</Text>
            </View>

            <View style={styles.formContainer}>
              <Input
                variant="tonal"
                label="MOBILE NUMBER"
                prefix="+91"
                placeholder="98765 43210"
                keyboardType="number-pad"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                maxLength={10}
                accessibilityLabel="Mobile number input"
              />

              <Button
                label="Send OTP"
                onPress={handleSendOTP}
                disabled={mobileNumber.length < 10}
                loading={loading}
                fullWidth
                icon={<ArrowRight color={tokens.primaryForeground} size={20} />}
                accessibilityLabel="Send OTP"
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <Text
              style={styles.footerLinkText}
              accessibilityRole="link"
            >
              Terms of Service
            </Text>
            <Text
              style={styles.footerLinkText}
              accessibilityRole="link"
            >
              Privacy Policy
            </Text>
          </View>
          <Text style={styles.copyrightText}>© 2026 BillZest. All rights reserved.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    arcBackground: {
      position: 'absolute',
      top: -height * 0.4,
      width: width * 1.5,
      height: height * 0.8,
      borderRadius: (width * 1.5) / 2,
      backgroundColor: tokens.primaryAlpha15,
      alignSelf: 'center',
      zIndex: 0,
    },
    keyboardView: {
      flex: 1,
      zIndex: 1,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.spacingXl,
    },
    header: {
      alignItems: 'center',
      marginBottom: tokens.spacingXxl,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tokens.spacingMd,
    },
    checkIcon: {
      marginRight: tokens.spacingSm,
    },
    logoTextPrimary: {
      fontSize: 32,
      fontWeight: '800',
      color: tokens.foreground,
      textTransform: 'uppercase',
      letterSpacing: -1,
    },
    logoTextZest: {
      color: tokens.primary,
    },
    tagline: {
      color: tokens.mutedForeground,
      fontSize: 15,
      fontWeight: '500',
    },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: tokens.card,
      borderRadius: tokens.radiusXl,
      padding: tokens.spacingXxl,
      alignItems: 'stretch',
      shadowColor: tokens.shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 32,
      elevation: 8,
    },
    cardHeader: {
      alignItems: 'center',
      marginBottom: tokens.spacingXl,
    },
    welcomeText: {
      fontSize: 22,
      fontWeight: '700',
      color: tokens.foreground,
      marginBottom: tokens.spacingSm,
    },
    subtitleText: {
      fontSize: 14,
      color: tokens.mutedForeground,
      textAlign: 'center',
    },
    formContainer: {
      width: '100%',
      gap: tokens.spacingXl,
    },
    footer: {
      paddingBottom: tokens.spacingXl,
      paddingTop: tokens.spacingSm,
      alignItems: 'center',
    },
    footerLinks: {
      flexDirection: 'row',
      gap: tokens.spacingXl,
      marginBottom: tokens.spacingSm,
    },
    footerLinkText: {
      color: tokens.mutedForeground,
      fontSize: 12,
      textDecorationLine: 'underline',
    },
    copyrightText: {
      color: tokens.mutedForeground,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
      opacity: 0.6,
    },
  });

export default MobileLoginScreen;
