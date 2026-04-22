import * as SecureStore from 'expo-secure-store';
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export type ThemeMode = 'dark' | 'light';

export type AppTheme = {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  textSoft: string;
  primary: string;
  primaryText: string;
  secondaryButton: string;
  secondaryButtonText: string;
  inputBackground: string;
  inputBorder: string;
  chipBackground: string;
  chipActiveBackground: string;
  chipBorder: string;
  chipActiveBorder: string;
  good: string;
  warning: string;
  danger: string;
  dangerBackground: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  toggleTheme: () => Promise<void>;
};

const THEME_KEY = 'themeMode';

const darkTheme: AppTheme = {
  background: '#081f08',
  surface: '#102d12',
  border: '#1f4824',
  text: '#eef6ee',
  textMuted: '#8fb58f',
  textSoft: '#b8cbb8',
  primary: '#2d7a38',
  primaryText: '#ffffff',
  secondaryButton: '#1a2b1b',
  secondaryButtonText: '#d6dfd6',
  inputBackground: '#173a19',
  inputBorder: '#244d27',
  chipBackground: '#173a19',
  chipActiveBackground: '#1f5a25',
  chipBorder: '#244d27',
  chipActiveBorder: '#5faa65',
  good: '#9cd19f',
  warning: '#f0c67a',
  danger: '#f28d8d',
  dangerBackground: '#4a1717',
};

const lightTheme: AppTheme = {
  background: '#f3f8f1',
  surface: '#ffffff',
  border: '#d7e4d3',
  text: '#153118',
  textMuted: '#5b775f',
  textSoft: '#78907c',
  primary: '#2d7a38',
  primaryText: '#ffffff',
  secondaryButton: '#e6efe3',
  secondaryButtonText: '#244127',
  inputBackground: '#edf5ea',
  inputBorder: '#d1e0cc',
  chipBackground: '#edf5ea',
  chipActiveBackground: '#dcecd7',
  chipBorder: '#d1e0cc',
  chipActiveBorder: '#6ea976',
  good: '#2d7a38',
  warning: '#b67a1f',
  danger: '#b44848',
  dangerBackground: '#f6e2e2',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode | null>(null);

  useEffect(() => {
    const loadTheme = async () => {
      const storedMode = await SecureStore.getItemAsync(THEME_KEY);
      setMode(storedMode === 'light' ? 'light' : 'dark');
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    if (!mode) return;

    const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    await SecureStore.setItemAsync(THEME_KEY, nextMode);
  };

  const value = useMemo(() => {
    if (!mode) return null;

    return {
      mode,
      theme: mode === 'dark' ? darkTheme : lightTheme,
      toggleTheme,
    };
  }, [mode]);

  if (!value) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }

  return context;
}