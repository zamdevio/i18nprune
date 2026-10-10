import type { TranslateConfigInput } from '../config/translate.js';
import type { RuntimeAdapters } from '../runtime/adapters.js';
import type { TranslatorEnv } from '../../shared/constants/translate.js';

export type TranslateContext = {
  /** Translate-block config (provider list, primary, policy, workers). */
  readonly config: TranslateConfigInput;
  /** Runtime adapters — required, no Node default. Hosts pass theirs in (CLI: createNodeRuntimeAdapters). */
  readonly adapters: RuntimeAdapters;
  /** Env map — required, no `process.*` access in core. Hosts pass theirs in (CLI: process.env). */
  readonly env: TranslatorEnv;
  /**
   * Cooperative-cancellation signal. When aborted, `runTranslate` stops before the next provider
   * attempt and unwinds an in-flight pool with an `AbortError`. Omitted ⇒ no cancellation.
   */
  readonly signal?: AbortSignal;
};
