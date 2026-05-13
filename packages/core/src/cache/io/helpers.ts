import { assertSyncPortResult } from '../../runtime/helpers/sync/index.js';
import { tryParseJsonText } from '../../shared/json/index.js';
import type { CacheRuntime, CacheWarning } from '../../types/cache/index.js';

/** ISO-8601 timestamp from the runtime clock, falling back to `Date.now()` when no runtime is available. */
export function nowIso(runtime?: Pick<CacheRuntime, 'system'>): string {
  return new Date(runtime?.system.now() ?? Date.now()).toISOString();
}

/** Byte length of a UTF-8 string using the runtime adapter when available, otherwise `TextEncoder`. */
export function textByteLength(text: string, runtime: CacheRuntime): number {
  return runtime.byteLength ? runtime.byteLength(text) : new TextEncoder().encode(text).length;
}

/**
 * Reads a JSON cache file with size-limit and format guards.
 *
 * Returns the parsed data on success, or a diagnostic `CacheWarning` when the file is
 * missing, oversized, non-JSON, or unreadable. Never throws — IO/parse errors are
 * captured as warnings so the caller can treat the slot as a cache miss.
 */
export function readJsonFileWithLimit<T>(
  filePath: string,
  maxBytes: number,
  runtime: CacheRuntime,
): { data?: T; warning?: CacheWarning } {
  try {
    if (!assertSyncPortResult(runtime.fs.exists(filePath), 'fs.exists', filePath)) return {};
    const kind = assertSyncPortResult(runtime.fs.statKind(filePath), 'fs.statKind', filePath);
    if (kind !== 'file') {
      return {
        warning: {
          code: 'cache_io_error',
          message: 'cache path is not a file; skipping',
          path: filePath,
        },
      };
    }
    const knownSize = runtime.fileSize?.(filePath);
    if (knownSize !== undefined && knownSize > maxBytes) {
      return {
        warning: {
          code: 'cache_oversize',
          message: `cache file exceeds size limit (${String(knownSize)} > ${String(maxBytes)} bytes); skipping`,
          path: filePath,
        },
      };
    }
    const raw = assertSyncPortResult(runtime.fs.readText(filePath), 'fs.readText', filePath);
    const size = knownSize ?? textByteLength(raw, runtime);
    if (size > maxBytes) {
      return {
        warning: {
          code: 'cache_oversize',
          message: `cache file exceeds size limit (${String(size)} > ${String(maxBytes)} bytes); skipping`,
          path: filePath,
        },
      };
    }
    const parsed = tryParseJsonText<T>(raw, { filePath, issueCode: 'i18nprune.cache.json' });
    if (!parsed.ok) {
      return {
        warning: {
          code: 'cache_malformed',
          message: parsed.error.message,
          path: filePath,
        },
      };
    }
    return { data: parsed.data };
  } catch (err) {
    return {
      warning: {
        code: 'cache_io_error',
        message: `cache read error: ${err instanceof Error ? err.message : String(err)}`,
        path: filePath,
      },
    };
  }
}

/**
 * Writes a JSON value to disk atomically when the runtime supports it, falling back to
 * `fs.mkdirp` + `fs.writeText`. Returns a `CacheWarning` on failure instead of throwing.
 */
export function writeJsonAtomic(filePath: string, data: unknown, runtime: CacheRuntime): CacheWarning | undefined {
  try {
    const content = JSON.stringify(data, null, 2);
    if (runtime.writeTextAtomic) {
      runtime.writeTextAtomic(filePath, content);
      return undefined;
    }
    assertSyncPortResult(runtime.fs.mkdirp(runtime.path.dirname(filePath)), 'fs.mkdirp', runtime.path.dirname(filePath));
    assertSyncPortResult(runtime.fs.writeText(filePath, content), 'fs.writeText', filePath);
    return undefined;
  } catch (err) {
    return {
      code: 'cache_io_error',
      message: `cache write error: ${err instanceof Error ? err.message : String(err)}`,
      path: filePath,
    };
  }
}
