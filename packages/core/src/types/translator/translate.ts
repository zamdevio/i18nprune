import type { Issue } from '../json/envelope/index.js';
import type { TranslationProviderId } from './providers.js';
import type { TranslationLeafMeta } from './result.js';
import type { TranslationTickProgressFn } from '../progress/tick.js';
import type { ProviderAttemptOutcome } from '../../translator/policy/fallback.js';
import type { TranslateRunPartialStats } from '../../generate/translateRunInterruptedError.js';
import type { TranslateConfigInput } from '../config/translate.js';
import type { RuntimeAdapters } from '../runtime/adapters.js';
import type { TranslatorEnv } from '../../shared/constants/translate.js';

/**
 * Re-export so SDK consumers building **`TranslateInput`** don't need to know which sub-module
 * defines the partial-stats shape.
 */
export type { TranslateRunPartialStats };

/**
 * Per-leaf input keyed by an arbitrary stable identifier. The translator preserves order; the
 * **`key`** is echoed back in **`TranslateResultItem.key`** so callers can re-zip with their source.
 */
export type TranslateLeafInput = {
  readonly key: string;
  readonly source: string;
};

/**
 * Outcome of a single provider attempt within the translator's per-provider chain. Aggregated into
 * **`TranslateOutput.providerAttempts`** so callers can render attempt history (CLI summary, SDK logs)
 * without re-deriving it.
 */
export type ProviderAttemptReport = {
  readonly providerId: TranslationProviderId;
  readonly outcome: ProviderAttemptOutcome;
  /** Provider error message (when **`outcome !== 'success'`**); not always set on early failures. */
  readonly errorMessage?: string;
  /** Per-attempt stats (request attempts, retries, success/failure counts). */
  readonly stats?: TranslateRunPartialStats;
  /** Wall-clock duration of this attempt in milliseconds. */
  readonly durationMs?: number;
};

/** Per-leaf result preserving input order; **`key`** present when input used **`leaves`**. */
export type TranslateResultItem =
  | {
      readonly ok: true;
      readonly key?: string;
      readonly value: string;
      readonly providerId: TranslationProviderId;
      readonly leafMeta?: TranslationLeafMeta;
    }
  | {
      readonly ok: false;
      readonly key?: string;
      readonly reason: 'identity' | 'failed' | 'skipped';
      readonly sourceValue: string;
    };

/**
 * Hooks let hosts observe the translator without owning orchestration. **`onTick`** drives a UI
 * progress bar; **`onProviderAttempt`** records each attempt for an envelope; **`onTranslatedLeaf`**
 * fires per leaf so the host can drive identity-streak prompts or write-through caches.
 */
export type TranslateHooks = {
  readonly onTick?: TranslationTickProgressFn;
  readonly onProviderAttempt?: (attempt: ProviderAttemptReport) => void;
  readonly onTranslatedLeaf?: (
    sourceText: string,
    translatedText: string,
    key: string | number,
  ) => void | Promise<void>;
};

/**
 * Identity-streak guard wiring. Disabled by default; when **`enabled: true`** the translator wires the
 * core **`createIdentityStreakGuard`** with the supplied threshold and surfaces accumulated streak
 * issues on **`TranslateOutput.issues`**. Hosts that need an interactive confirm prompt should keep
 * owning the guard themselves and pass results in via **`hooks.onTranslatedLeaf`**.
 */
export type TranslateIdentityGuardOptions = {
  readonly enabled?: boolean;
  readonly threshold?: number;
};

/**
 * Inputs for **`runTranslate`** — the public SDK primitive that orchestrates one or more providers,
 * retries, and the identity guard. Use **`texts`** for plain string lists or **`leaves`** for
 * keyed pairs; the output preserves input order.
 */
export type TranslateInput = {
  /** Plain strings to translate; mutually exclusive with **`leaves`**. */
  readonly texts?: readonly string[];
  /** Keyed leaves; mutually exclusive with **`texts`**. */
  readonly leaves?: readonly TranslateLeafInput[];

  readonly targetLang: string;
  readonly sourceLang?: string;

  /**
   * Translate-block config only — no full **`I18nPruneConfig`** required. **`runTranslate`** runs
   * **`resolveTranslateConfig`** internally and surfaces its warnings on the output.
   */
  readonly config: TranslateConfigInput;

  /** Required: hosts always supply runtime adapters; core has no Node default. */
  readonly adapters: RuntimeAdapters;
  /** Required: hosts always supply env; core never reads **`process.*`**. */
  readonly env: TranslatorEnv;

  /** Pin a provider id (CLI **`--provider`**) and/or a **`workers`** override for this run. */
  readonly pin?: { providerId?: TranslationProviderId; workers?: number };

  readonly hooks?: TranslateHooks;
  readonly identityGuard?: TranslateIdentityGuardOptions;
};

/**
 * Result of **`runTranslate`** — translations preserve input order; **`providerAttempts`** records
 * the attempted chain (success ends the chain, retryable failures advance it, non-retryable failures
 * end the run); **`warnings`** is forwarded from **`resolveTranslateConfig`** so hosts can display
 * default-applied notes.
 */
export type TranslateOutput = {
  readonly translations: ReadonlyArray<TranslateResultItem>;
  readonly providerAttempts: ReadonlyArray<ProviderAttemptReport>;
  readonly winnerProviderId: TranslationProviderId | null;
  readonly fallbackCount: number;
  readonly translateStats: TranslateRunPartialStats;
  readonly issues: ReadonlyArray<Issue>;
  readonly warnings: ReadonlyArray<Issue>;
};
