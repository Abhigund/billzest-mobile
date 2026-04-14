import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2 } from 'lucide-react-native';
import type { DashboardStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');

const VerifyOTPScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const route = useRoute<any>();
  const mobileNumber = route.params?.mobileNumber || '98765 43210';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
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
      // Logic for actual verification can be added here
      // For now, let's just go back to Dashboard
      navigation.navigate('DashboardMain');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Arc Background Decoration */}
      <View style={styles.arcBackground} />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Top Branding Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoTextPrimary}>
                BILL<Text style={styles.logoTextZest}>ZEST</Text>
              </Text>
            </View>
            <Text style={styles.tagline}>Smart billing for Indian businesses</Text>
            <View style={styles.checkContainer}>
              <CheckCircle2 color="#1db954" size={32} fill="transparent" strokeWidth={2.5}/>
            </View>
          </View>

          {/* OTP Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.welcomeText}>Verify OTP</Text>
              <Text style={styles.subtitleText}>
                Enter the 6-digit code sent to <Text style={styles.mobileBold}>+91 {mobileNumber}</Text>
              </Text>
            </View>

            {/* OTP Input Grid */}
            <View style={styles.otpGrid}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={el => {
                    inputRefs.current[index] = el;
                  }}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  placeholder="•"
                  placeholderTextColor="#6d7b6c"
                />
              ))}
            </View>

            {/* Resend Logic */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn&apos;t receive code? </Text>
              <TouchableOpacity>
                <Text style={styles.resendAction}>Resend OTP</Text>
              </TouchableOpacity>
            </View>

            {/* CTA Button */}
            <TouchableOpacity 
              style={[
                styles.submitButton,
                otp.join('').length < 6 && styles.submitButtonDisabled
              ]} 
              onPress={handleVerify}
              disabled={otp.join('').length < 6}
            >
              <Text style={styles.submitButtonText}>Verify & Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Footer Section */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity><Text style={styles.footerLinkText}>Privacy Policy</Text></TouchableOpacity>
            <View style={styles.footerDot} />
            <TouchableOpacity><Text style={styles.footerLinkText}>Terms of Service</Text></TouchableOpacity>
          </View>
          <Text style={styles.copyrightText}>© 2024 BillZest. All rights reserved.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  arcBackground: {
    position: 'absolute',
    top: -height * 0.4,
    width: width * 1.5,
    height: height * 0.8,
    borderRadius: (width * 1.5) / 2,
    backgroundColor: '#f0fdf4',
    alignSelf: 'center',
    zIndex: 0,
  },
  keyboardView: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoTextPrimary: {
    fontSize: 32,
    fontWeight: '800',
    color: '#201a1a',
    fontStyle: 'italic',
  },
  logoTextZest: {
    color: '#1db954',
  },
  tagline: {
    color: '#3d4a3d',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 32,
  },
  checkContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderColor: 'rgba(188, 203, 185, 0.15)',
    borderWidth: 1,
    shadowColor: '#191c1d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 4,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#191c1d',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: '#3d4a3d',
    textAlign: 'center',
  },
  mobileBold: {
    fontWeight: '600',
    color: '#191c1d',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: '#e1e3e4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(188, 203, 185, 0.5)',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#191c1d',
    padding: 0,
  },
  otpInputFilled: {
    borderColor: '#1db954',
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  resendText: {
    fontSize: 12,
    color: '#3d4a3d',
    fontWeight: '500',
  },
  resendAction: {
    fontSize: 12,
    color: '#1db954',
    fontWeight: 'bold',
  },
  submitButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#1db954',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1db954',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  footerLinkText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#645d5c',
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(188, 203, 185, 0.5)',
  },
  copyrightText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(61, 74, 61, 0.7)',
    fontStyle: 'italic',
  }
});

export default VerifyOTPScreen;
