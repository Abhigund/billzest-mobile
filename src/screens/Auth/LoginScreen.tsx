import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { supabase } from '../../supabase/supabaseClient';
import { testSupabaseConnection } from '../../utils/testSupabaseConnection';
import { logger } from '../../utils/logger';

const LoginScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
   

  const formatAuthError = (authError: any): string => {
    if (!authError) return 'Something went wrong. Please try again.';

    const status = authError.status ?? authError.code ?? 'unknown';
    const message = authError.message ?? authError.error_description;

    // Supabase returns 400 with "Invalid login credentials" when the server is reachable
    if (status === 400 && message?.toLowerCase().includes('invalid')) {
      return 'Invalid email or password. Please check your credentials.';
    }

    // Network / connectivity issues surface as retryable fetch errors
    if (authError.name === 'AuthRetryableFetchError') {
      return 'Cannot reach Supabase. Check your network and try again.';
    }

    return message || 'Unable to sign in. Please try again.';
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleLogin = async () => {
    // Inline validation before calling Supabase
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email');
      return;
    }
    setEmailError(null);
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        logger.warn('[Auth] Sign-in error', {
          status: error.status,
          message: error.message,
          name: error.name,
        });
        setError(formatAuthError(error));
      }
      } catch (authError) {
      logger.error('Login error (exception)', authError);
      setError('Cannot reach Supabase. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Enter your email to get a reset link.');
      return;
    }

    setResetting(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        logger.warn('[Auth] Reset-password error', {
          status: error.status,
          message: error.message,
          name: error.name,
        });
        setError(formatAuthError(error));
        return;
      }
      Alert.alert('Check your email', 'We sent a password reset link to your inbox.');
    } catch (authError) {
      logger.error('Reset password error (exception)', authError);
      setError('Cannot reach Supabase. Check your connection and try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.heroBlock}>
          <Image
            source={require('../../assets/BillZest_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible
            accessibilityLabel="BillZest logo"
          />
          <Text style={styles.brand}>BillZest</Text>
          <Text style={styles.heroTitle}>Sign in to your store</Text>
          <Text style={styles.heroSubtitle}>
            Manage products, invoices, and customers from one place.
          </Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@business.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            containerStyle={styles.field}
            error={emailError || undefined}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            secureToggle
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            containerStyle={styles.field}
            error={error || undefined}
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading || resetting}
            fullWidth
          />
          <Button
            label="Forgot password?"
            variant="secondary"
            onPress={handleResetPassword}
            loading={resetting}
            disabled={!email || resetting}
            fullWidth
            style={styles.forgotCta}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    heroBlock: {
      marginBottom: 32,
      alignItems: 'center',
    },
    logo: {
      width: 96,
      height: 96,
      marginBottom: 12,
    },
    brand: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.primary,
      marginBottom: 6,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: tokens.foreground,
      marginBottom: 6,
    },
    heroSubtitle: {
      fontSize: 15,
      color: tokens.mutedForeground,
    },
    card: {
      backgroundColor: tokens.card,
      borderRadius: 24,
      padding: 24,
      // No-Line Rule: shadow elevation replaces 1px border
      shadowColor: tokens.shadowColor,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
      elevation: 4,
    },
    field: {
      marginBottom: 16,
    },
    errorText: {
      color: tokens.destructive,
      marginBottom: 12,
      fontSize: 13,
      fontWeight: '600',
    },
    forgotCta: {
      marginTop: 12,
    },
  });

export default LoginScreen;
