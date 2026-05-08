import type { FillOptions } from '@/types/command/fill/index.js';

/** Command-specific **`I18NPRUNE_FILL_*`** env merge hooks can live here; translation provider uses `resolveTranslationProviderOptions` (CLI + env + config). */
export function mergeFillOptionsFromEnv(opts: FillOptions): FillOptions {
  return { ...opts };
}
