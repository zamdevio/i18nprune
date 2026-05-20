import { assertSyncPortResult } from '../../runtime/helpers/sync/index.js';
import { SHARE_BAK_DIRNAME, SHARE_JSON_BASENAME } from '../../shared/constants/share.js';
import type { CacheRuntime } from '../../types/cache/index.js';

export type ShareJsonBackupResult = {
  created: boolean;
  /** Absolute path to the backup file when {@link created} is true. */
  bakPath?: string;
};

/** `{projectCacheDir}/share.bak/` */
export function resolveShareBakDir(projectDir: string, path: { join: (...parts: string[]) => string }): string {
  return path.join(projectDir, SHARE_BAK_DIRNAME);
}

function shareJsonBackupFilename(stamp: number | string): string {
  return `share.json.bak.${String(stamp)}.json`;
}

/**
 * Copies the current `share.json` bytes to `share.bak/share.json.bak.<stamp>.json` (raw text — invalid JSON is preserved).
 * Used from {@link loadShareJsonFile} corrupt/oversize paths only — not from normal {@link saveShareJsonFile} writes.
 * Does not remove or modify `share.json`.
 */
export function backupShareJsonRaw(sharePath: string, runtime: CacheRuntime): ShareJsonBackupResult {
  const exists = assertSyncPortResult(runtime.fs.exists(sharePath), 'fs.exists', sharePath);
  if (!exists) return { created: false };

  const projectDir = runtime.path.dirname(sharePath);
  const bakDir = resolveShareBakDir(projectDir, runtime.path);
  const stamp = runtime.system.now();
  const bakPath = runtime.path.join(bakDir, shareJsonBackupFilename(stamp));

  try {
    const raw = assertSyncPortResult(runtime.fs.readText(sharePath), 'fs.readText', sharePath);
    assertSyncPortResult(runtime.fs.mkdirp(bakDir), 'fs.mkdirp', bakDir);
    assertSyncPortResult(runtime.fs.writeText(bakPath, raw), 'fs.writeText', bakPath);
    return { created: true, bakPath };
  } catch {
    return { created: false };
  }
}

/**
 * Backs up then deletes `share.json` (used when the on-disk file is unreadable and will be replaced).
 */
export function backupAndRemoveCorruptShareJson(sharePath: string, runtime: CacheRuntime): ShareJsonBackupResult {
  const backed = backupShareJsonRaw(sharePath, runtime);
  if (!backed.created) return backed;
  try {
    assertSyncPortResult(runtime.fs.deleteFile(sharePath), 'fs.deleteFile', sharePath);
  } catch {
    return { created: false };
  }
  return backed;
}

/** User-facing line for hosts when a backup was written. */
export function shareJsonBackupNotice(bakPath: string): string {
  return `Previous ${SHARE_JSON_BASENAME} was copied to ${bakPath} before it was replaced. You can restore or inspect that file under share.bak/ if needed.`;
}
