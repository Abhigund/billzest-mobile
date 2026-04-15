import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTokens, lightTokens, ThemeTokens } from './tokens';

import { useAppSettingsStore } from '../stores/appSettingsStore';

interface ThemeContextValue {
  tokens: ThemeTokens;
  mode: 'light' | 'dark';
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useAppSettingsStore();

  const mode: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'system') {
      return colorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, colorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      tokens: mode === 'dark' ? darkTokens : lightTokens,
      mode,
      themeMode,
      setThemeMode,
    }),
    [mode, themeMode, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemeTokens = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeTokens must be used within ThemeProvider');
  }
  return ctx;
};
