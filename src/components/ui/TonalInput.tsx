import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';

interface TonalInputProps extends TextInputProps {
  label: string;
  prefix?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  error?: string;
}

const TonalInput: React.FC<TonalInputProps> = ({
  label,
  prefix,
  containerStyle,
  inputStyle,
  labelStyle,
  error,
  ...props
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <View style={[styles.inputContainer, !!error && styles.errorBorder]}>
        {prefix && (
          <View style={styles.prefixContainer}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        )}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={tokens.border + '80'} // 50% opacity
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      marginBottom: 8,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.mutedForeground,
      marginBottom: 2,
      marginLeft: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.muted,
      borderRadius: 14,
      overflow: 'hidden',
      minHeight: 44, // Minimum height for a compact look, allows growth for multiline
    },
    prefixContainer: {
      paddingHorizontal: 16,
      height: '100%',
      justifyContent: 'center',
      backgroundColor: tokens.secondary,
    },
    prefixText: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.mutedForeground,
    },
    input: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 10, // Re-adding some internal padding for multiline text alignment
      fontSize: 14,
      color: tokens.foreground,
      fontWeight: '500',
    },
    errorBorder: {
      borderWidth: 1,
      borderColor: tokens.destructive,
    },
    errorText: {
      fontSize: 11,
      color: tokens.destructive,
      marginTop: 4,
      marginLeft: 4,
    },
  });

export default TonalInput;
