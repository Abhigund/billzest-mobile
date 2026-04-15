import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../theme/ThemeProvider';
import { ThemeTokens } from '../theme/tokens';
import { ArrowLeft } from 'lucide-react-native';

export interface DetailHeaderAction {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
}

interface DetailHeaderProps {
  title: string;
  onBack?: () => void;
  actions?: DetailHeaderAction[];
  showBack?: boolean;
}

const DetailHeader: React.FC<DetailHeaderProps> = ({
  title,
  onBack,
  actions = [],
  showBack = true,
}) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.toolbar}>
      {showBack && (
        <Pressable
          accessibilityLabel="Go back"
          style={styles.iconButton}
          onPress={handleBack}
        >
          <ArrowLeft color={tokens.primary} size={24} strokeWidth={2.5} />
        </Pressable>
      )}
      {!showBack && <View style={styles.iconButton} />}
      <Text style={styles.toolbarTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.toolbarActions}>
        {actions.map((action, index) => (
          <Pressable
            key={index}
            style={[styles.iconButton, index > 0 && styles.iconButtonSpacer]}
            onPress={action.onPress}
            accessibilityLabel={action.accessibilityLabel}
          >
            {action.icon}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: tokens.background,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    iconButtonSpacer: {
      marginLeft: 8,
    },
    toolbarTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: tokens.foreground,
      textAlign: 'center',
      marginHorizontal: 12,
    },
    toolbarActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

export default DetailHeader;

