import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const lightTheme = {
  name: 'light',
  colors: {
    // Primary Blues
    primary: '#173BA6',
    primaryDark: '#091140',
    primaryMedium: '#0E2773',
    
    // Accent/Secondary
    accent: '#8FAID9',
    
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F2',
    backgroundTertiary: '#E8E8E8',
    
    // Text
    text: '#091140',
    textSecondary: '#666666',
    textMuted: '#999999',
    textInverse: '#FFFFFF',
    
    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Borders
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    
    // Shadows
    shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.12)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
};

export const darkTheme = {
  name: 'dark',
  colors: {
    // Primary Blues (from your palette)
    primary: '#3E63E8',
    primaryDark: '#080A1D',
    primaryMedium: '#1A1F3A',
    
    // Accent
    accent: '#8FA0E6',
    
    // Backgrounds
    background: '#030409',
    backgroundSecondary: '#080A1D',
    backgroundTertiary: '#0F1225',
    
    // Text
    text: '#EDEFF7',
    textSecondary: '#A8AEC0',
    textMuted: '#686E7E',
    textInverse: '#030409',
    
    // Status colors
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#3E63E8',
    
    // Borders
    border: '#1A1F3A',
    borderLight: '#0F1225',
    
    // Shadows
    shadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.7)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.8)',
  },
};

export const adminTheme = lightTheme; // Admin always uses light theme

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('store-mapper-theme');
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('store-mapper-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, ...currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
