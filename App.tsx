import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useThemeTokens } from './src/theme/ThemeProvider';
import { SupabaseProvider } from './src/contexts/SupabaseContext';
import { OrganizationProvider } from './src/contexts/OrganizationContext';

const queryClient = new QueryClient();

const AppContent = () => {
  const { mode } = useThemeTokens();
  return (
    <>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </>
  );
};

function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <OrganizationProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </OrganizationProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
