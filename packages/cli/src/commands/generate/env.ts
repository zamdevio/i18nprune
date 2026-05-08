import {
  ENV_I18NPRUNE_GENERATE_DIRECTION,
  ENV_I18NPRUNE_GENERATE_DRY_RUN,
  ENV_I18NPRUNE_GENERATE_ENGLISH_NAME,
  ENV_I18NPRUNE_GENERATE_FORCE,
  ENV_I18NPRUNE_GENERATE_LANG,
  ENV_I18NPRUNE_GENERATE_NATIVE_NAME,
} from '@/constants/env.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';

function truthy(v: string | undefined): boolean {
  return v === '1' || v?.toLowerCase() === 'true' || v?.toLowerCase() === 'yes';
}

/** Defaults from `I18NPRUNE_GENERATE_*` (see `docs/config/env.md`). */
export function mergeGenerateOptionsFromEnv(opts: GenerateOptions): GenerateOptions {
  const e = process.env;
  const out: GenerateOptions = { ...opts };
  if (e[ENV_I18NPRUNE_GENERATE_LANG]) out.target = e[ENV_I18NPRUNE_GENERATE_LANG];
  if (e[ENV_I18NPRUNE_GENERATE_ENGLISH_NAME]) out.englishName = e[ENV_I18NPRUNE_GENERATE_ENGLISH_NAME];
  if (e[ENV_I18NPRUNE_GENERATE_NATIVE_NAME]) out.nativeName = e[ENV_I18NPRUNE_GENERATE_NATIVE_NAME];
  const dir = e[ENV_I18NPRUNE_GENERATE_DIRECTION];
  if (dir === 'ltr' || dir === 'rtl') {
    out.direction = dir;
  }
  if (truthy(e[ENV_I18NPRUNE_GENERATE_FORCE])) out.force = true;
  if (truthy(e[ENV_I18NPRUNE_GENERATE_DRY_RUN])) out.dryRun = true;
  return out;
}
