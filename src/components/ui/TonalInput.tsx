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
          placeholderTextColor='rgba(180,180,180,0.7)'
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
      marginBottom: tokens.spacingSm, // 8px
    },
    label: {
      fontSize: 12, // Secondary size
      fontWeight: '600', // Semi-bold
      color: tokens.mutedForeground,
      marginBottom: tokens.spacingXs, // 4px
      marginLeft: tokens.spacingXs, // 4px
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: tokens.muted,
      borderRadius: tokens.radiusSm, // 8px
      overflow: 'hidden',
      minHeight: 40, // Reduced height for more compact look
    },
    prefixContainer: {
      paddingHorizontal: tokens.spacingMd, // 12px
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
      minHeight: 40, // Match container height
      paddingHorizontal: tokens.spacingMd, // 12px
      paddingVertical: 8, // Reduced vertical padding
      fontSize: 15, // Primary size
      color: tokens.foreground,
      fontWeight: '500',
      textAlignVertical: 'center',
    },
    errorBorder: {
      borderWidth: 1,
      borderColor: tokens.destructive,
    },
    errorText: {
      fontSize: 11,
      color: tokens.destructive,
      marginTop: tokens.spacingXs, // 4px
      marginLeft: tokens.spacingXs, // 4px
    },
  });

export default TonalInput;
