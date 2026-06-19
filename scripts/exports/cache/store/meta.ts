import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';

import type { InventorySnapshot } from '../../inventory/index.js';
import {
  CACHE_META_VERSION,
  TOOL_VERSION,
  cacheDirForSha,
  exportsCacheRoot,
  exportsMetaPath,
  fullSnapshotPathForSha,
} from '../../paths.js';
import { readJsonFile, writeJsonAtomic } from './io.js';
import { purgeStaleCacheForSha } from './files.js';
import type { CacheMeta, CacheMetaEntry } from './types.js';
import { isValidSnapshot, isValidSummary, snapshotMatchesSha } from './validation.js';

function defaultMeta(): CacheMeta {
  return { version: CACHE_META_VERSION, toolVersion: TOOL_VERSION, entries: {} };
}

let metaMemo: CacheMeta | undefined;

function entryFromInventoryDir(sha: string): CacheMetaEntry | undefined {
  const inventoryPath = fullSnapshotPathForSha(sha);
  if (!existsSync(inventoryPath)) return undefined;
  const snapshot = readJsonFile<InventorySnapshot>(inventoryPath);
  if (!isValidSnapshot(snapshot) || !snapshotMatchesSha(sha, snapshot)) return undefined;
  return {
    requestedRefs: snapshot.refLabel ? [snapshot.refLabel] : [],
    generatedAt: snapshot.generatedAt,
    summary: snapshot.summary,
    commitDate: snapshot.git?.commitDate,
  };
}

/** Self-heal: sync meta with `<sha>/` dirs; drop stale rows; recover from valid dirs. */
export function healCacheMeta(meta: CacheMeta): CacheMeta {
  const next: CacheMeta = {
    version: CACHE_META_VERSION,
    toolVersion: TOOL_VERSION,
    entries: { ...meta.entries },
  };

  mkdirSync(exportsCacheRoot, { recursive: true });

  for (const [sha, entry] of Object.entries(next.entries)) {
    const inventoryPath = fullSnapshotPathForSha(sha);
    if (!existsSync(inventoryPath)) {
      delete next.entries[sha];
      continue;
    }
    const snapshot = readJsonFile<InventorySnapshot>(inventoryPath);
    if (!isValidSnapshot(snapshot) || !snapshotMatchesSha(sha, snapshot)) {
      purgeStaleCacheForSha(sha);
      delete next.entries[sha];
    } else if (!isValidSummary(entry.summary)) {
      next.entries[sha] = entryFromInventoryDir(sha)!;
    }
  }

  try {
    for (const name of readdirSync(exportsCacheRoot)) {
      if (name === 'meta.json') continue;
      const dirPath = cacheDirForSha(name);
      if (!statSync(dirPath).isDirectory()) continue;
      purgeStaleCacheForSha(name);
      if (next.entries[name]) continue;
      const recovered = entryFromInventoryDir(name);
      if (recovered) next.entries[name] = recovered;
    }
  } catch {
    /* cache root unreadable — return best-effort meta */
  }

  return next;
}

/** Load meta.json; rebuild index from disk when missing or corrupt. */
export function loadCacheMeta(): CacheMeta {
  if (metaMemo) {
    return { ...metaMemo, entries: { ...metaMemo.entries } };
  }

  const fromDisk = readJsonFile<CacheMeta>(exportsMetaPath);
  const metaValid =
    fromDisk &&
    fromDisk.version === CACHE_META_VERSION &&
    fromDisk.toolVersion === TOOL_VERSION &&
    typeof fromDisk.entries === 'object' &&
    fromDisk.entries;
  const meta = metaValid
    ? { ...fromDisk, entries: { ...fromDisk.entries } }
    : defaultMeta();

  metaMemo = healCacheMeta(meta);
  if (!metaValid) {
    saveCacheMeta(metaMemo);
  }
  return { ...metaMemo, entries: { ...metaMemo.entries } };
}


function saveCacheMeta(meta: CacheMeta): void {
  writeJsonAtomic(exportsMetaPath, meta);
  metaMemo = meta;
}

export function touchMetaEntry(
  meta: CacheMeta,
  sha: string,
  snapshot: InventorySnapshot,
  refLabel: string,
): void {
  const prev = meta.entries[sha];
  const requestedRefs = new Set(prev?.requestedRefs ?? []);
  if (prev && requestedRefs.has(refLabel) && prev.generatedAt === snapshot.generatedAt) {
    return;
  }
  requestedRefs.add(refLabel);
  meta.entries[sha] = {
    requestedRefs: [...requestedRefs],
    generatedAt: snapshot.generatedAt,
    summary: snapshot.summary,
    commitDate: snapshot.git?.commitDate,
  };
  saveCacheMeta(meta);
}
