import type { I18nPruneConfig } from '../../config/schema/index.js';
import type { CacheRuntime, CacheState } from '../cache/index.js';
import type { LocaleReadCache } from '../locales/readCache.js';
import type { RuntimeAdapters } from '../runtime/adapters.js';
import type { RunOptions } from '../runtime/index.js';
import type { TranslatorEnv } from '../../shared/constants/translate.js';

/** Resolved project paths (absolute); hosts compute once (CLI: `resolveContext`). */
export type CoreResolvedPaths = {
  readonly sourceLocale: string;
  readonly localesDir: string;
  readonly srcRoot: string;
};

/**
 * L2 bundle for project ops (`runValidate`, `runSync`, `runGenerate`, …). Same adapters/env rules as
 * {@link TranslateContext}: required, no runtime defaults inside core.
 */
export type CoreContext = {
  readonly config: I18nPruneConfig;
  readonly adapters: RuntimeAdapters;
  readonly env: TranslatorEnv;
  readonly paths: CoreResolvedPaths;
  /**
   * When **`false`**, no **`i18nprune.config.*`** was found on disk (CLI: **`configExists()`**).
   * Hosts omit this field when unknown; **`runProjectReadiness`** only enforces **`configFilePresent`**
   * when **`configFileLoaded === false`**.
   */
  readonly configFileLoaded?: boolean;
  readonly run?: RunOptions;
  /**
   * Cooperative-cancellation signal for long-running ops. A host that wants to interrupt work
   * (e.g. `serve`'s `$/cancelRequest`) sets this; core checks it at its natural await boundaries and
   * unwinds with an {@link AbortError}. Omitted ⇒ no cancellation.
   */
  readonly signal?: AbortSignal;
  readonly cache?: {
    readonly state: CacheState;
    readonly runtime: CacheRuntime;
    /** Pre-loaded `files.json` baseline; shared across sibling dispatches for accurate delta. */
    readonly baselineFiles?: Record<string, import('../cache/index.js').CacheProjectFileRecord>;
  };
  /** Per-run in-memory locale JSON reads (segment + merged locale-code views). */
  readonly localeRead: LocaleReadCache;
};
