import type { ThemeMode } from '@i18nprune/ui/react/theme';

const LEGACY_THEME_KEY = 'i18nprune-release-theme';

const VALID_MODES = new Set<ThemeMode>(['light', 'dark', 'system']);

/**
 * Clears invalid stored theme so first visit follows OS (ThemeProvider default).
 * After the user toggles, only `light` or `dark` are persisted.
 */
export function prepareThemeStorage(storageKey: string): void {
  if (typeof window === 'undefined') return;

  try {
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    const current = localStorage.getItem(storageKey);

    if (!current && legacy && VALID_MODES.has(legacy as ThemeMode)) {
      localStorage.setItem(storageKey, legacy);
      localStorage.removeItem(LEGACY_THEME_KEY);
    }

    const value = localStorage.getItem(storageKey);
    if (!value || !VALID_MODES.has(value as ThemeMode)) {
      localStorage.removeItem(storageKey);
      // ThemeProvider defaults to `system` when key is absent
    }
  } catch {
    /* private mode / blocked storage */
  }
}
