import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import ActionSheet from './ActionSheet';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
type ProductOptionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  showInactive?: boolean;
  onToggleShowInactive?: (value: boolean) => void;
};

const ProductOptionsSheet: React.FC<ProductOptionsSheetProps> = ({
  visible,
  onClose,
  showInactive: showInactiveProp = false,
  onToggleShowInactive,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const [showInactive, setShowInactive] = useState(showInactiveProp);

  return (
    <ActionSheet visible={visible} onClose={onClose} title="More Options">
      <View style={styles.container}>

        <Pressable
          style={styles.row}
          onPress={() => {
            const newValue = !showInactive;
            setShowInactive(newValue);
            onToggleShowInactive?.(newValue);
          }}
        >
          <Text style={styles.label}>Show Inactive</Text>
          <View style={[styles.checkbox, showInactive && styles.checked]} />
        </Pressable>

      </View>
    </ActionSheet>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
    },
    label: {
      fontSize: 16,
      color: tokens.foreground,
      fontWeight: '500',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: tokens.mutedForeground,
    },
    checked: {
      backgroundColor: tokens.primary,
      borderColor: tokens.primary,
    },
  });

export default ProductOptionsSheet;
