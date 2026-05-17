import type { RunEmitter } from '@i18nprune/core';

/** Flags for `i18nprune generate` (CLI + programmatic API). */
export type GenerateOptions = {
  /** Optional `--provider` override; full precedence is `resolveTranslationProviderOptions` (flag → env → `translate` in config). */
  provider?: string;
  /** Max parallel **`translateLeaf`** calls (overrides env and **`translate.workers`**). */
  workers?: number;
  /** When set, resolved from cwd (programmatic override). */
  source?: string;
  /** Preferred alias for locale targets (single code or comma-separated list). */
  target?: string;
  /** English display label override; default from the languages catalog for `--target` when omitted. */
  englishName?: string;
  /** Native endonym override; default from the languages catalog for `--target` when omitted. */
  nativeName?: string;
  /** Layout direction for consumers (`document.dir`); default `ltr`. */
  direction?: 'ltr' | 'rtl';
  /** Skip “already complete” prompt and re-translate (also `I18NPRUNE_GENERATE_FORCE`). */
  force?: boolean;
  /** Skip actual translation and only validate the target locales. */
  dryRun?: boolean;
  /** Write/repair structured locale leaves (`{ value, status, confidence, needsReview, source }`). */
  metadata?: boolean;
  /** Top-up existing locale JSON. Use CLI **`--resume`** only. */
  resume?: boolean;
  /** With **`resume`**: process all non-source locales under **`localesDir`**. */
  all?: boolean;
  /** With **`resume`**: confirm before processing targets. */
  ask?: boolean;
};

export type GenerateRuntime = { emit?: RunEmitter; runId?: string };
