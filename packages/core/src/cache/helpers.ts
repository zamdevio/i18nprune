import { assertSyncPortResult } from '../runtime/helpers/sync/index.js';
import { tryParseJsonText } from '../shared/json/index.js';
import type { CacheRuntime, CacheWarning } from '../types/cache/index.js';

export const MAX_PROJECTS_INDEX_BYTES = 2 * 1024 * 1024; // 2 MiB
export const MAX_PROJECT_FILES_BYTES = 32 * 1024 * 1024; // 32 MiB
export const MAX_PROJECT_RUN_BYTES = 16 * 1024 * 1024; // 16 MiB

export function nowIso(runtime?: Pick<CacheRuntime, 'system'>): string {
  return new Date(runtime?.system.now() ?? Date.now()).toISOString();
}

function textByteLength(text: string, runtime: CacheRuntime): number {
  return runtime.byteLength ? runtime.byteLength(text) : new TextEncoder().encode(text).length;
}

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
    const parsed = tryParseJsonText<T>(raw, { filePath });
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
