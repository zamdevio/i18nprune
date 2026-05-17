import { parseI18nPruneConfig } from '@i18nprune/core/config';
import type { I18nPruneConfig } from '@i18nprune/core/config';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    const cur = out[k];
    if (isPlainObject(cur) && isPlainObject(v)) {
      out[k] = deepMerge(cur, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Deep-merge user overrides from the Generate UI into the loaded workspace config, then re-parse with Zod.
 * Invalid combinations surface as {@link ConfigValidationError} at the callsite.
 */
export function mergeConfigOverrides(base: I18nPruneConfig, patch: unknown): I18nPruneConfig {
  if (patch === undefined || patch === null) return base;
  if (!isPlainObject(patch)) return base;
  const merged = deepMerge(
    structuredClone(base) as unknown as Record<string, unknown>,
    patch,
  );
  return parseI18nPruneConfig(merged);
}
