import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextInputProps,
  Pressable,
} from 'react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import { Eye, EyeOff } from 'lucide-react-native';

export type InputVariant = 'outlined' | 'tonal';

export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  secureToggle?: boolean;
  variant?: InputVariant;
  prefix?: string;
}

const Input = React.forwardRef<TextInput, InputProps>((props, ref) => {
  const {
    label,
    hint,
    error,
    containerStyle,
    style,
    secureToggle = false,
    secureTextEntry,
    variant = 'outlined',
    prefix,
    ...rest
  } = props;
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const hasError = Boolean(error);
  const [isSecure, setIsSecure] = React.useState<boolean>(
    Boolean(secureTextEntry),
  );
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    setIsSecure(Boolean(secureTextEntry));
  }, [secureTextEntry]);

  const isTonal = variant === 'tonal';

  return (
    <View style={[isTonal && styles.tonalContainer, containerStyle]}>
      {label && (
        <Text style={[styles.label, isTonal && styles.tonalLabel]}>{label}</Text>
      )}
      <View style={[styles.inputWrapper, isTonal && styles.tonalWrapper]}>
        {prefix && (
          <View style={[styles.prefixContainer, isTonal && styles.tonalPrefixContainer]}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={tokens.mutedForeground}
          style={[
            styles.input,
            isTonal && styles.tonalInput,
            isFocused && (isTonal ? styles.tonalFocused : styles.outlinedFocused),
            secureToggle && styles.inputWithAccessory,
            prefix && styles.inputWithPrefix,
            hasError && styles.inputError,
            style,
          ]}
          secureTextEntry={isSecure}
          onFocus={e => { setIsFocused(true); rest.onFocus?.(e); }}
          onBlur={e => { setIsFocused(false); rest.onBlur?.(e); }}
          {...rest}
        />
        {secureToggle && (
          <Pressable
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            style={styles.secureToggle}
            onPress={() => setIsSecure(prev => !prev)}
          >
            {isSecure ? (
              <Eye color={tokens.mutedForeground} size={18} />
            ) : (
              <EyeOff color={tokens.mutedForeground} size={18} />
            )}
          </Pressable>
        )}
      </View>
      {(hint || error) && (
        <Text style={[styles.hint, hasError && { color: tokens.destructive }]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    label: {
      fontSize: 14,
      fontWeight: '600', // Semi-bold
      color: tokens.foreground,
      marginBottom: tokens.spacingXs, // 4px
    },
    tonalLabel: {
      fontSize: 12, // Secondary size
      fontWeight: '600', // Semi-bold
      color: tokens.mutedForeground,
      marginBottom: tokens.spacingXs, // 4px
      marginLeft: tokens.spacingXs, // 4px
    },
    tonalContainer: {
      marginBottom: tokens.spacingSm, // 8px
    },
    input: {
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: tokens.radiusSm, // 8px
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: 10, // Reduced for compact look
      color: tokens.foreground,
      backgroundColor: tokens.card,
      fontSize: 15, // Primary size
      minHeight: 40, // Reduced height
    },
    tonalInput: {
      borderWidth: 0,
      backgroundColor: tokens.muted,
      fontSize: 15, // Primary size
      fontWeight: '500',
      minHeight: 40, // Reduced height
      paddingVertical: 8, // Reduced padding
    },
    inputWrapper: {
      position: 'relative',
      justifyContent: 'center',
    },
    tonalWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.muted,
      borderRadius: tokens.radiusSm, // 8px
      overflow: 'hidden',
      minHeight: 40, // Reduced height
    },
    outlinedFocused: {
      borderColor: tokens.ring,
    },
    tonalFocused: {
      borderWidth: 1.5,
      borderColor: tokens.ring,
    },
    inputError: {
      borderWidth: 1,
      borderColor: tokens.destructive,
    },
    inputWithAccessory: {
      paddingRight: 40, // Reduced to match 40px height
    },
    inputWithPrefix: {
      flex: 1,
      paddingLeft: 4,
    },
    prefixContainer: {
      paddingHorizontal: tokens.spacingMd, // 12px
      justifyContent: 'center',
      backgroundColor: tokens.secondary,
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    tonalPrefixContainer: {
      backgroundColor: tokens.secondary,
    },
    prefixText: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.mutedForeground,
    },
    secureToggle: {
      position: 'absolute',
      right: tokens.spacingSm, // 8px
      height: '100%',
      justifyContent: 'center',
    },
    hint: {
      fontSize: 12, // Secondary size
      color: tokens.mutedForeground,
      marginTop: tokens.spacingXs, // 4px
    },
  });

export default Input;
