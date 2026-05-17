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

/** Values parsed from process env before merging into {@link I18nPruneConfig}. */
export type EnvConfigOverrides = {
  localesSourceFile?: string;
  localesDirectory?: string;
  src?: string;
  functions?: string[];
  noDiscovery?: boolean;
  noInit?: boolean;
};

/** Merge env into a config-shaped object (partial). Keys mirror `constants/env.ts`. */
export function loadEnvOverrides(): EnvConfigOverrides {
  const e = process.env;
  const out: EnvConfigOverrides = {};
  if (e[ENV_I18NPRUNE_SOURCE]) out.localesSourceFile = e[ENV_I18NPRUNE_SOURCE];
  if (e[ENV_I18NPRUNE_LOCALES_DIR]) out.localesDirectory = e[ENV_I18NPRUNE_LOCALES_DIR];
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

export function applyEnvToConfig(base: I18nPruneConfig, env: EnvConfigOverrides): I18nPruneConfig {
  return {
    ...base,
    locales: {
      ...base.locales,
      ...(env.localesSourceFile !== undefined ? { source: env.localesSourceFile } : {}),
      ...(env.localesDirectory !== undefined ? { directory: env.localesDirectory } : {}),
    },
    ...(env.src !== undefined ? { src: env.src } : {}),
    ...(env.functions !== undefined && env.functions.length > 0 ? { functions: env.functions } : {}),
  };
}
