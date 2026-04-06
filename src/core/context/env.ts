import type { I18nPruneConfig } from '@/types/config/index.js';

function truthy(v: string | undefined): boolean {
  return v === '1' || v?.toLowerCase() === 'true' || v?.toLowerCase() === 'yes';
}

/** Merge env into a config-shaped object (partial). Keys mirror `I18NPRUNE_*` in `types/core/context/env.ts`. */
export function loadEnvOverrides(): Partial<I18nPruneConfig> & {
  noDiscovery?: boolean;
  noInit?: boolean;
} {
  const out: Partial<I18nPruneConfig> & { noDiscovery?: boolean; noInit?: boolean } = {};
  if (process.env.I18NPRUNE_SOURCE) out.source = process.env.I18NPRUNE_SOURCE;
  if (process.env.I18NPRUNE_LOCALES_DIR) out.localesDir = process.env.I18NPRUNE_LOCALES_DIR;
  if (process.env.I18NPRUNE_SRC) out.src = process.env.I18NPRUNE_SRC;
  if (process.env.I18NPRUNE_FUNCTIONS) {
    out.functions = process.env.I18NPRUNE_FUNCTIONS.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (truthy(process.env.I18NPRUNE_NO_DISCOVERY)) out.noDiscovery = true;
  if (truthy(process.env.I18NPRUNE_NO_INIT)) out.noInit = true;
  return out;
}

export function applyEnvToConfig(
  base: I18nPruneConfig,
  env: ReturnType<typeof loadEnvOverrides>,
): I18nPruneConfig {
  return {
    ...base,
    ...(env.source !== undefined ? { source: env.source } : {}),
    ...(env.localesDir !== undefined ? { localesDir: env.localesDir } : {}),
    ...(env.src !== undefined ? { src: env.src } : {}),
    ...(env.functions !== undefined && env.functions.length > 0 ? { functions: env.functions } : {}),
  };
}
