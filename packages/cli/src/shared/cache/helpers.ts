import fs from 'node:fs';
import path from 'node:path';
import type { CliCacheWarning } from '@/types/shared/cache/index.js';

export const MAX_PROJECTS_INDEX_BYTES = 2 * 1024 * 1024; // 2 MiB
export const MAX_PROJECT_FILES_BYTES = 32 * 1024 * 1024; // 32 MiB
export const MAX_PROJECT_RUN_BYTES = 16 * 1024 * 1024; // 16 MiB

export function nowIso(): string {
  return new Date().toISOString();
}

export function safeJsonParse<T>(raw: string): T | undefined {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function readJsonFileWithLimit<T>(filePath: string, maxBytes: number): { data?: T; warning?: CliCacheWarning } {
  try {
    if (!fs.existsSync(filePath)) return {};
    const st = fs.statSync(filePath);
    if (!st.isFile()) {
      return {
        warning: {
          code: 'cache_io_error',
          message: 'cache path is not a file; skipping',
          path: filePath,
        },
      };
    }
    if (st.size > maxBytes) {
      return {
        warning: {
          code: 'cache_oversize',
          message: `cache file exceeds size limit (${String(st.size)} > ${String(maxBytes)} bytes); skipping`,
          path: filePath,
        },
      };
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = safeJsonParse<T>(raw);
    if (!parsed) {
      return {
        warning: {
          code: 'cache_malformed',
          message: 'cache file is not valid JSON; skipping',
          path: filePath,
        },
      };
    }
    return { data: parsed };
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

export function writeJsonAtomic(filePath: string, data: unknown): CliCacheWarning | undefined {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${filePath}.tmp-${process.pid}-${Date.now().toString(36)}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
    return undefined;
  } catch (err) {
    return {
      code: 'cache_io_error',
      message: `cache write error: ${err instanceof Error ? err.message : String(err)}`,
      path: filePath,
    };
  }
}
