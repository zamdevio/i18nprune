import type { GenerateOptions } from '@/types/command/generate/index.js';

function truthy(v: string | undefined): boolean {
  return v === '1' || v?.toLowerCase() === 'true' || v?.toLowerCase() === 'yes';
}

/** Defaults from `I18NPRUNE_GENERATE_*` (see docs). */
export function mergeGenerateOptionsFromEnv(opts: GenerateOptions): GenerateOptions {
  const e = process.env;
  const out: GenerateOptions = { ...opts };
  if (e.I18NPRUNE_GENERATE_LANG) out.lang = e.I18NPRUNE_GENERATE_LANG;
  if (e.I18NPRUNE_GENERATE_ENGLISH_NAME) out.englishName = e.I18NPRUNE_GENERATE_ENGLISH_NAME;
  if (e.I18NPRUNE_GENERATE_NATIVE_NAME) out.nativeName = e.I18NPRUNE_GENERATE_NATIVE_NAME;
  if (e.I18NPRUNE_GENERATE_DIRECTION === 'ltr' || e.I18NPRUNE_GENERATE_DIRECTION === 'rtl') {
    out.direction = e.I18NPRUNE_GENERATE_DIRECTION;
  }
  if (truthy(e.I18NPRUNE_GENERATE_NO_META)) out.noMeta = true;
  if (truthy(e.I18NPRUNE_GENERATE_FORCE)) out.force = true;
  if (truthy(e.I18NPRUNE_GENERATE_DRY_RUN)) out.dryRun = true;
  return out;
}
