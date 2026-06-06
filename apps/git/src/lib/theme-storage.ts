import type { ThemeMode } from '@i18nprune/ui/react/theme';

const VALID_MODES = new Set<ThemeMode>(['light', 'dark', 'system']);

export function prepareThemeStorage(storageKey: string): void {
  if (typeof window === 'undefined') return;

  try {
    const value = localStorage.getItem(storageKey);
    if (!value || !VALID_MODES.has(value as ThemeMode)) {
      localStorage.removeItem(storageKey);
    }
  } catch {
    /* private mode / blocked storage */
  }
}
