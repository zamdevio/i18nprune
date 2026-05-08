import {
  ENV_I18NPRUNE_FUNCTIONS,
  ENV_I18NPRUNE_LOCALES_DIR,
  ENV_I18NPRUNE_NO_DISCOVERY,
  ENV_I18NPRUNE_NO_INIT,
  ENV_I18NPRUNE_SOURCE,
  ENV_I18NPRUNE_SRC,
} from '@/constants/env.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';

function truthy(v: string | undefined): boolean {
  return v === '1' || v?.toLowerCase() === 'true' || v?.toLowerCase() === 'yes';
}

/** Merge env into a config-shaped object (partial). Keys mirror `constants/env.ts`. */
export function loadEnvOverrides(): Partial<I18nPruneConfig> & {
  noDiscovery?: boolean;
  noInit?: boolean;
} {
  const e = process.env;
  const out: Partial<I18nPruneConfig> & { noDiscovery?: boolean; noInit?: boolean } = {};
  if (e[ENV_I18NPRUNE_SOURCE]) out.source = e[ENV_I18NPRUNE_SOURCE];
  if (e[ENV_I18NPRUNE_LOCALES_DIR]) out.localesDir = e[ENV_I18NPRUNE_LOCALES_DIR];
  if (e[ENV_I18NPRUNE_SRC]) out.src = e[ENV_I18NPRUNE_SRC];
  if (e[ENV_I18NPRUNE_FUNCTIONS]) {
    out.functions = e[ENV_I18NPRUNE_FUNCTIONS].split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (truthy(e[ENV_I18NPRUNE_NO_DISCOVERY])) out.noDiscovery = true;
  if (truthy(e[ENV_I18NPRUNE_NO_INIT])) out.noInit = true;
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
