import { assertSyncPortResult } from '../../runtime/helpers/sync/index.js';
import { SHARE_BAK_DIRNAME, SHARE_JSON_BASENAME } from '../../shared/constants/share.js';
import type { CacheRuntime } from '../../types/cache/index.js';
import type { ShareJsonBackupResult } from '../../types/share/cache.js';

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

/** Bullet label before the `share.bak/` path in human / issue copy. */
export const SHARE_JSON_HEAL_BACKUP_LABEL = 'Corrupt backup preserved:' as const;

/** Bullet when a canonical `share.json` was written after heal. */
export const SHARE_JSON_HEAL_CANONICAL_SAVED = 'Saved canonical share.json' as const;

/** Detail rows stored on {@link ShareJsonHealReport.details} when a backup was created. */
export function shareJsonBackupDetailEntries(bakPath: string): readonly [typeof SHARE_JSON_HEAL_BACKUP_LABEL, string] {
  return [SHARE_JSON_HEAL_BACKUP_LABEL, bakPath];
}

/** One warn block for hosts when load-time heal replaced `share.json` after backing up corrupt bytes. */
export function shareJsonBackupWarnMessage(bakPath: string): string {
  return [
    `Previous ${SHARE_JSON_BASENAME} was replaced after repair.`,
    `  • ${SHARE_JSON_HEAL_BACKUP_LABEL}`,
    `    ${bakPath}`,
    `  • ${SHARE_JSON_HEAL_CANONICAL_SAVED}`,
  ].join('\n');
}
