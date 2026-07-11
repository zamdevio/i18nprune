import { getAtPath } from '../json/index.js';
import { isSentinelLeakPending } from '../placeholders/sentinelLeak.js';

/**
 * True when **`localeJson`** at **`path`** already holds a string value different from the English
 * **`sourceValue`** (legacy string leaf or structured `{ value }`). Used to resume **`generate`** /
 * **`generate --resume`** after a provider fails mid-run without re-calling the translator for completed paths.
 *
 * Stale **`__I18NPRUNE_*`** mask sentinels are **not** treated as translated (resume + generate re-queue them).
 */
export function localePathLooksTranslatedFromSource(
  localeJson: unknown,
  path: string,
  sourceValue: string,
): boolean {
  if (localeJson === null || localeJson === undefined || typeof localeJson !== 'object') return false;
  const cur = getAtPath(localeJson as object, path);
  if (typeof cur === 'string') {
    if (isSentinelLeakPending(cur)) return false;
    return cur !== sourceValue;
  }
  if (cur && typeof cur === 'object' && !Array.isArray(cur)) {
    const v = (cur as { value?: unknown }).value;
    if (typeof v === 'string') {
      if (isSentinelLeakPending(v)) return false;
      return v !== sourceValue;
    }
  }
  return false;
}
