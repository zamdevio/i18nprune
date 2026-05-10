/**
 * Translator-only context for **`runTranslate`**. Pure value object: bundle the translate-block
 * config, runtime adapters, and env so callers thread one thing instead of three. Project
 * orchestration (CoreContext / runGenerate / runQuality / …) is a separate, larger context.
 */

import type { TranslateConfigInput } from '../types/config/translate.js';
import type { RuntimeAdapters } from '../types/runtime/adapters.js';
import type { TranslatorEnv } from '../shared/constants/translate.js';

export type TranslateContext = {
  /** Translate-block config (provider list, primary, policy, workers). */
  readonly config: TranslateConfigInput;
  /** Runtime adapters — required, no Node default. Hosts pass theirs in (CLI: createNodeRuntimeAdapters). */
  readonly adapters: RuntimeAdapters;
  /** Env map — required, no `process.*` access in core. Hosts pass theirs in (CLI: process.env). */
  readonly env: TranslatorEnv;
};

/**
 * Build a {@link TranslateContext} for SDK consumers translating strings without a full i18nprune
 * project. CoreContext-holding callers should use **`translateContextFromCore`** instead.
 */
export function createTranslateContext(input: {
  config: TranslateConfigInput;
  adapters: RuntimeAdapters;
  env: TranslatorEnv;
}): TranslateContext {
  return {
    config: input.config,
    adapters: input.adapters,
    env: input.env,
  };
}
