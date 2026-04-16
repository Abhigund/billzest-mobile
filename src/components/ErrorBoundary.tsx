import React, { Component, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  BackHandler,
} from "react-native";
import { useThemeTokens } from "../theme/ThemeProvider";
import { ThemeTokens } from "../theme/tokens";
import { navigationRef } from "../navigation/RootNavigator";
import DetailHeader from "./DetailHeader";
import { AlertTriangle, RefreshCw, Home } from "lucide-react-native";
import { logger } from "../utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to logger
    logger.error("[ErrorBoundary] Caught error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const { tokens } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);

  const handleGoHome = React.useCallback(() => {
    // Try multiple navigation strategies to get back to a safe state
    try {
      if (navigationRef.isReady()) {
        // Check if we can reset to Home (the drawer root)
        navigationRef.reset({
          index: 0,
          routes: [{ name: "Home" as any }],
        });
      } else {
        // If navigation is not ready, just reset the boundary
        onReset();
      }
    } catch (err) {
      try {
        if (navigationRef.isReady()) {
          // Fallback to DashboardTab if Home reset fails
          navigationRef.navigate("DashboardTab" as any);
        } else {
          onReset();
        }
      } catch (e) {
        // If all navigation fails, try to reset the UI locally
        onReset();
      }
    }
  }, [onReset]);

  // Handle hardware back button on Android
  React.useEffect(() => {
    const onBackPress = () => {
      handleGoHome();
      return true; // Intercept and handle
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [handleGoHome]);

  return (
    <View style={styles.container}>
      <DetailHeader
        title="Unexpected Error"
        onBack={handleGoHome}
        actions={[
          {
            icon: <Home size={18} color={tokens.foreground} />,
            onPress: handleGoHome,
            accessibilityLabel: "Go to home",
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={48} color={tokens.destructive} />
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          We&apos;re sorry, but something unexpected happened. Please try again.
        </Text>
        {error && __DEV__ && (
          <View style={styles.errorDetails}>
            <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
            <Text style={styles.errorText}>{error.message}</Text>
            {error.stack && (
              <Text style={styles.errorStack}>{error.stack}</Text>
            )}
          </View>
        )}
        <View style={styles.buttonRow}>
          <Pressable style={styles.secondaryButton} onPress={handleGoHome}>
            <Home size={18} color={tokens.foreground} />
            <Text style={styles.secondaryButtonText}>Go Home</Text>
          </Pressable>
          <Pressable style={styles.resetButton} onPress={onReset}>
            <RefreshCw size={18} color={tokens.primaryForeground} />
            <Text style={styles.resetButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    iconContainer: {
      marginBottom: 24,
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: tokens.foreground,
      marginBottom: 12,
      textAlign: "center",
    },
    message: {
      fontSize: 16,
      color: tokens.mutedForeground,
      textAlign: "center",
      marginBottom: 32,
      lineHeight: 24,
    },
    errorDetails: {
      width: "100%",
      backgroundColor: tokens.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: tokens.foreground,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 12,
      color: tokens.destructive,
      fontFamily: "monospace",
      marginBottom: 8,
    },
    errorStack: {
      fontSize: 10,
      color: tokens.mutedForeground,
      fontFamily: "monospace",
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
      justifyContent: "center",
    },
    resetButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 999,
      gap: 8,
    },
    resetButtonText: {
      color: tokens.primaryForeground,
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tokens.card,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 999,
      gap: 8,
    },
    secondaryButtonText: {
      color: tokens.foreground,
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default ErrorBoundary;
