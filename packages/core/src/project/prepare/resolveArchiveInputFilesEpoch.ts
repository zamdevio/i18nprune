import { computeInputFilesEpoch } from '../../cache/engine.js';
import type { CacheProjectFileRecord } from '../../types/cache/index.js';
import { sha256HexBytes } from '../../share/util/sha256.js';

/**
 * Stable digest of zip text files (path + content hash), same basis as host `filesEpoch` / share skip policy.
 */
export async function resolveArchiveInputFilesEpoch(
  textFiles: Record<string, string>,
): Promise<string | undefined> {
  const keys = Object.keys(textFiles).sort((a, b) => a.localeCompare(b));
  if (keys.length === 0) return undefined;

  const records: Record<string, CacheProjectFileRecord> = {};
  for (const relPath of keys) {
    const raw = textFiles[relPath]!;
    const hash = await sha256HexBytes(new TextEncoder().encode(raw));
    records[relPath] = { hash, size: raw.length, mtimeMs: 0, updatedAt: '1970-01-01T00:00:00.000Z' };
  }
  return computeInputFilesEpoch(records);
}
