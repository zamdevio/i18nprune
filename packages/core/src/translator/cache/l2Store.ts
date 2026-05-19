import { assertSyncPortResult } from '../../runtime/helpers/sync/index.js';
import { nowIso } from '../../cache/io/helpers.js';
import type { CacheRuntime, CacheState, CacheWarning } from '../../types/cache/index.js';
import type { TranslationCacheEntry, TranslationLocaleCacheFile } from '../../types/translator/cache.js';
import type { TranslationProviderId } from '../../types/translator/providers.js';
import type { TranslationResult } from '../../types/translator/result.js';
import { buildTranslateCacheKeyForLocaleFile } from './cacheKey.js';
import {
  loadTranslationLocaleCacheFile,
  saveTranslationLocaleCacheFile,
} from './l2Io.js';
import { resolveLocaleTranslationCachePath, resolveTranslationsDir } from './paths.js';

type L2Row = {
  result: TranslationResult;
  providerId: TranslationProviderId;
};

function entryToRow(entry: TranslationCacheEntry): L2Row {
  return {
    result: {
      text: entry.text,
      leafMeta: entry.leafMeta,
      ...(entry.decision !== undefined ? { decision: entry.decision } : {}),
    },
    providerId: entry.providerId,
  };
}

function rowToEntry(row: L2Row, createdAt: string): TranslationCacheEntry {
  return {
    text: row.result.text,
    leafMeta: row.result.leafMeta,
    ...(row.result.decision !== undefined ? { decision: row.result.decision } : {}),
    providerId: row.providerId,
    createdAt,
  };
}

/** Per-target L2 translation cache backed by `translations/<targetLang>.json`. */
export class TranslateCacheL2Store {
  private readonly rows = new Map<string, L2Row>();
  private dirty = false;
  readonly targetLang: string;
  readonly localeFilePath: string;
  readonly inputFilesEpoch: string;
  readonly translateConfigEpoch: string;
  private readonly state: CacheState;
  private readonly runtime: CacheRuntime;

  private constructor(input: {
    state: CacheState;
    runtime: CacheRuntime;
    targetLang: string;
    localeFilePath: string;
    inputFilesEpoch: string;
    translateConfigEpoch: string;
    rows: Map<string, L2Row>;
    dirty: boolean;
  }) {
    this.state = input.state;
    this.runtime = input.runtime;
    this.targetLang = input.targetLang;
    this.localeFilePath = input.localeFilePath;
    this.inputFilesEpoch = input.inputFilesEpoch;
    this.translateConfigEpoch = input.translateConfigEpoch;
    for (const [key, row] of input.rows) {
      this.rows.set(key, row);
    }
    this.dirty = input.dirty;
  }

  /**
   * Load or create the on-disk store for one target locale.
   *
   * @remarks Ignores the file when `targetLang`, `inputFilesEpoch`, or `translateConfigEpoch` do not match.
   */
  static open(input: {
    state: CacheState;
    runtime: CacheRuntime;
    targetLang: string;
    inputFilesEpoch: string;
    translateConfigEpoch: string;
  }): { store: TranslateCacheL2Store; warnings: CacheWarning[] } {
    const warnings: CacheWarning[] = [];
    const translationsDir = resolveTranslationsDir(input.state, input.runtime);
    try {
      assertSyncPortResult(input.runtime.fs.mkdirp(translationsDir), 'fs.mkdirp', translationsDir);
    } catch {
      // flush/open guarded elsewhere
    }

    const localeFilePath = resolveLocaleTranslationCachePath(input.state, input.runtime, input.targetLang);
    const loaded = loadTranslationLocaleCacheFile(localeFilePath, input.runtime);
    warnings.push(...loaded.warnings);
    const rows = new Map<string, L2Row>();
    const disk = loaded.locale;
    if (
      disk !== undefined &&
      disk.targetLang === input.targetLang &&
      disk.inputFilesEpoch === input.inputFilesEpoch &&
      disk.translateConfigEpoch === input.translateConfigEpoch
    ) {
      for (const [key, entry] of Object.entries(disk.entries)) {
        rows.set(key, entryToRow(entry));
      }
    }
    return {
      store: new TranslateCacheL2Store({
        state: input.state,
        runtime: input.runtime,
        targetLang: input.targetLang,
        localeFilePath,
        inputFilesEpoch: input.inputFilesEpoch,
        translateConfigEpoch: input.translateConfigEpoch,
        rows,
        dirty: false,
      }),
      warnings,
    };
  }

  buildKey(input: {
    sourceText: string;
    sourceLang: string;
    providerId: TranslationProviderId;
  }): string {
    return buildTranslateCacheKeyForLocaleFile({
      ...input,
      translateConfigEpoch: this.translateConfigEpoch,
    });
  }

  get(key: string): TranslationResult | undefined {
    return this.rows.get(key)?.result;
  }

  set(key: string, result: TranslationResult, providerId: TranslationProviderId): void {
    this.rows.set(key, { result, providerId });
    this.dirty = true;
  }

  /** Writes this locale file when the store changed during the run. */
  flush(): CacheWarning | undefined {
    if (!this.dirty) return undefined;
    const createdAt = nowIso(this.runtime);
    const entries: Record<string, TranslationCacheEntry> = {};
    for (const [key, row] of this.rows.entries()) {
      entries[key] = rowToEntry(row, createdAt);
    }
    const payload: TranslationLocaleCacheFile = {
      version: 1,
      updatedAt: createdAt,
      targetLang: this.targetLang,
      translateConfigEpoch: this.translateConfigEpoch,
      inputFilesEpoch: this.inputFilesEpoch,
      entries,
    };
    const warn = saveTranslationLocaleCacheFile(this.state, this.runtime, this.localeFilePath, payload);
    if (!warn) this.dirty = false;
    return warn;
  }

  size(): number {
    return this.rows.size;
  }
}
