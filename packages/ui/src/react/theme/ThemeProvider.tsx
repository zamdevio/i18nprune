import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  Theme,
  ThemeApplyStrategy,
  ThemeContextValue,
  ThemeMode,
  ThemeProviderProps,
} from '../../types/theme/index.js';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'light' || mode === 'dark') return mode;
  return getSystemTheme();
}

function readStoredMode(storageKey: string): ThemeMode {
  try {
    const v = localStorage.getItem(storageKey);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function persistMode(storageKey: string, mode: ThemeMode): void {
  try {
    localStorage.setItem(storageKey, mode);
  } catch {
    /* ignore */
  }
}

function applyThemeToDocument(theme: Theme, strategy: ThemeApplyStrategy): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  if (strategy === 'class-and-data-theme') {
    root.dataset.theme = theme;
  }
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  storageKey,
  applyStrategy = 'class',
  alwaysPersist = false,
}: ThemeProviderProps): JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>(() =>
    typeof window !== 'undefined' ? readStoredMode(storageKey) : 'system',
  );
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window !== 'undefined' ? resolveTheme(readStoredMode(storageKey)) : 'light',
  );

  useEffect(() => {
    setThemeState(resolveTheme(mode));
  }, [mode]);

  useEffect(() => {
    applyThemeToDocument(theme, applyStrategy);
    if (alwaysPersist || mode !== 'system') {
      persistMode(storageKey, mode);
    }
  }, [theme, mode, applyStrategy, alwaysPersist, storageKey]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => setThemeState(getSystemTheme());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      if (alwaysPersist) persistMode(storageKey, next);
    },
    [alwaysPersist, storageKey],
  );

  const setTheme = useCallback(
    (next: Theme) => {
      setMode(next);
    },
    [setMode],
  );

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const current = resolveTheme(prev);
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      if (alwaysPersist) persistMode(storageKey, next);
      return next;
    });
  }, [alwaysPersist, storageKey]);

  const value = useMemo(
    (): ThemeContextValue => ({
      theme,
      effective: theme,
      mode,
      themeChoice: mode,
      setMode,
      setTheme,
      toggleTheme,
      toggle: toggleTheme,
    }),
    [theme, mode, setMode, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
