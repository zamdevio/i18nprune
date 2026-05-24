import type { ReactNode } from 'react';
import type { Theme, ThemeApplyStrategy, ThemeMode } from './mode.js';

export type ThemeProviderProps = {
  children: ReactNode;
  storageKey: string;
  /** Default: `class`. Report uses `class-and-data-theme` for `data-theme`. */
  applyStrategy?: ThemeApplyStrategy;
  /**
   * When true (report), every `setMode` persists to localStorage.
   * When false (web), skip writes while mode is `system`.
   */
  alwaysPersist?: boolean;
};

export type ThemeContextValue = {
  /** Resolved light/dark appearance. */
  theme: Theme;
  /** Alias for report consumers. */
  effective: Theme;
  /** User preference including system. */
  mode: ThemeMode;
  /** Alias for web consumers. */
  themeChoice: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Sets explicit light or dark (web). */
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** Alias for report consumers. */
  toggle: () => void;
};
