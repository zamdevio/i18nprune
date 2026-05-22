import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { THEME_STORAGE_KEY } from '../lib/constants/storageKeys';

export type Theme = 'dark' | 'light';
export type ThemeChoice = 'system' | Theme;

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function themeFromChoice(choice: ThemeChoice): Theme {
  if (choice === 'light' || choice === 'dark') return choice;
  return getSystemTheme();
}

function applyThemeClass(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

type ThemeContextValue = {
  theme: Theme;
  themeChoice: ThemeChoice;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>(() => readThemeChoice());
  const [theme, setThemeState] = useState<Theme>(() => themeFromChoice(readThemeChoice()));

  useEffect(() => {
    setThemeState(themeFromChoice(choice));
  }, [choice]);

  useEffect(() => {
    applyThemeClass(theme);
    if (choice !== 'system') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, choice);
      } catch {
        /* ignore */
      }
    }
  }, [theme, choice]);

  useEffect(() => {
    if (choice !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setThemeState(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [choice]);

  const setTheme = useCallback((next: Theme) => {
    setChoice(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setChoice((prev) => {
      const current = themeFromChoice(prev);
      return current === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo(
    () => ({ theme, themeChoice: choice, setTheme, toggleTheme }),
    [theme, choice, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
