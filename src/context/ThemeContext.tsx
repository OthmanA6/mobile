import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, AppTheme, ThemeMode } from '../theme/theme';

const THEME_STORAGE_KEY = 'appThemeMode';

interface ThemeContextType {
  themeMode: ThemeMode;
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeMode: ThemeMode = 'dark';

  useEffect(() => {
    const forceDark = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark');
      } catch (e) {
        console.error('Failed to force dark theme', e);
      }
    };
    forceDark();
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    // No-op, always dark
  };

  const toggleTheme = () => {
    // No-op, always dark
  };

  const theme = darkTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
