import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2 } from 'lucide-react-native';
import type { DashboardStackParamList } from '../../navigation/types';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import Button from '../../components/ui/Button';

const { width, height } = Dimensions.get('window');

const VerifyOTPScreen = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const route = useRoute<RouteProp<DashboardStackParamList, 'VerifyOTP'>>();
  const mobileNumber = route.params?.mobileNumber || '98765 43210';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length === 6) {
      setLoading(true);
      navigation.navigate('DashboardMain');
      setLoading(false);
    }
  };

  const isComplete = otp.join('').length === 6;

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
              <Text style={styles.logoTextPrimary}>
                BILL<Text style={styles.logoTextZest}>ZEST</Text>
              </Text>
            </View>
            <Text style={styles.tagline}>Smart billing for Indian businesses</Text>
            <View style={styles.checkContainer}>
              <CheckCircle2 color={tokens.primary} size={32} fill="transparent" strokeWidth={2.5} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.welcomeText}>Verify OTP</Text>
              <Text style={styles.subtitleText}>
                Enter the 6-digit code sent to{' '}
                <Text style={styles.mobileBold}>+91 {mobileNumber}</Text>
              </Text>
            </View>

            <View style={styles.otpGrid}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={value => handleOtpChange(value, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  placeholder="•"
                  placeholderTextColor={tokens.mutedForeground}
                  accessibilityLabel={`OTP digit ${index + 1}`}
                />
              ))}
            </View>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive code? </Text>
              <Pressable
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Resend OTP"
              >
                <Text style={styles.resendAction}>Resend OTP</Text>
              </Pressable>
            </View>

            <Button
              label="Verify & Login"
              onPress={handleVerify}
              disabled={!isComplete}
              loading={loading}
              fullWidth
              accessibilityLabel="Verify and Login"
            />
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLinkText} accessibilityRole="link">Privacy Policy</Text>
            <View style={styles.footerDot} />
            <Text style={styles.footerLinkText} accessibilityRole="link">Terms of Service</Text>
          </View>
          <Text style={styles.copyrightText}>© 2025 BillZest. All rights reserved.</Text>
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
      alignItems: 'center',
      paddingHorizontal: tokens.spacingXl,
      paddingTop: 48,
    },
    header: {
      alignItems: 'center',
      marginBottom: tokens.spacingXxl,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tokens.spacingXs,
    },
    logoTextPrimary: {
      fontSize: 32,
      fontWeight: '800',
      color: tokens.foreground,
      fontStyle: 'italic',
    },
    logoTextZest: {
      color: tokens.primary,
    },
    tagline: {
      color: tokens.mutedForeground,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: tokens.spacingXxl,
    },
    checkContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: tokens.primaryAlpha15,
      justifyContent: 'center',
      alignItems: 'center',
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
      shadowOpacity: 0.08,
      shadowRadius: 32,
      elevation: 4,
    },
    cardHeader: {
      alignItems: 'center',
      marginBottom: tokens.spacingXxl,
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
    mobileBold: {
      fontWeight: '600',
      color: tokens.foreground,
    },
    otpGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: tokens.spacingXxl,
      gap: tokens.spacingSm,
    },
    otpInput: {
      flex: 1,
      height: 56,
      backgroundColor: tokens.muted,
      borderRadius: tokens.radiusMd,
      borderWidth: 1,
      borderColor: tokens.border,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '700',
      color: tokens.foreground,
      padding: 0,
    },
    otpInputFilled: {
      borderColor: tokens.primary,
      borderWidth: 2,
      backgroundColor: tokens.card,
    },
    resendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tokens.spacingXl,
      justifyContent: 'center',
    },
    resendText: {
      fontSize: 12,
      color: tokens.mutedForeground,
      fontWeight: '500',
    },
    resendAction: {
      fontSize: 12,
      color: tokens.primary,
      fontWeight: '700',
    },
    footer: {
      paddingBottom: tokens.spacingXl,
      alignItems: 'center',
    },
    footerLinks: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacingLg,
      marginBottom: tokens.spacingSm,
    },
    footerLinkText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: tokens.mutedForeground,
    },
    footerDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.border,
    },
    copyrightText: {
      fontSize: 11,
      fontWeight: '500',
      color: tokens.mutedForeground,
      fontStyle: 'italic',
    },
  });

export default VerifyOTPScreen;
