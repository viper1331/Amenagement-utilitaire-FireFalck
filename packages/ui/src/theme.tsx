import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import './styles.css';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  readonly theme: Theme;
  readonly resolvedTheme: 'light' | 'dark';
  readonly setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

interface ThemeProviderProps {
  readonly initialTheme?: Theme;
  readonly children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ initialTheme = 'system', children }) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    initialTheme === 'system' ? (typeof window === 'undefined' ? 'light' : getSystemTheme()) : initialTheme,
  );

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery =
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-color-scheme: dark)')
          : null;
      const applySystem = () => setResolvedTheme(mediaQuery?.matches ? 'dark' : 'light');
      applySystem();
      if (mediaQuery) {
        mediaQuery.addEventListener('change', applySystem);
        return () => mediaQuery.removeEventListener('change', applySystem);
      }
      return undefined;
    }
    setResolvedTheme(theme);
    return undefined;
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
