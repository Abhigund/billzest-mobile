import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';
import type { DashboardStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');

const MobileLoginScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const [mobileNumber, setMobileNumber] = useState('');

  const handleSendOTP = () => {
    if (mobileNumber.length >= 10) {
      navigation.navigate('VerifyOTP', { mobileNumber });
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
          {/* Header / Branding Area */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <CheckCircle2 color="#1db954" size={32} fill="#1db954" style={styles.checkIcon} />
              <Text style={styles.logoTextPrimary}>
                BILL<Text style={styles.logoTextZest}>ZEST</Text>
              </Text>
            </View>
            <Text style={styles.tagline}>Smart billing for Indian businesses</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.subtitleText}>Enter your mobile number to continue</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="98765 43210"
                    placeholderTextColor="#6d7b6c"
                    keyboardType="number-pad"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    maxLength={10}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  mobileNumber.length < 10 && styles.submitButtonDisabled
                ]} 
                onPress={handleSendOTP}
                disabled={mobileNumber.length < 10}
              >
                <Text style={styles.submitButtonText}>Send OTP</Text>
                <ArrowRight color="#ffffff" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Component */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity><Text style={styles.footerLinkText}>Terms of Service</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLinkText}>Privacy Policy</Text></TouchableOpacity>
          </View>
          <Text style={styles.copyrightText}>© 2026 BillZest. All rights reserved.</Text>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    marginRight: 8,
  },
  logoTextPrimary: {
    fontSize: 32,
    fontWeight: '800',
    color: '#191c1d',
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  logoTextZest: {
    color: '#1db954',
  },
  tagline: {
    color: '#3d4a3d',
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#191c1d',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
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
  },
  formContainer: {
    width: '100%',
    gap: 24,
  },
  inputGroup: {
    width: '100%',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#645d5c',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  countryCode: {
    backgroundColor: '#e1e3e4',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  countryCodeText: {
    color: '#191c1d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#e1e3e4',
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#191c1d',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.5)',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#1db954',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  footerLinkText: {
    color: '#64748b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  copyrightText: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  }
});

export default MobileLoginScreen;
