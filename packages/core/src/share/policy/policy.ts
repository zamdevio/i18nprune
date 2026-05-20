import type { ShareCacheEntry } from '../../types/share/entry.js';

/** Normalizes worker origin for comparisons and persistence (trim + no trailing slash). */
export function normalizeWorkerBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function projectPayloadMatchesCachedEntry(
  entry: ShareCacheEntry,
  payloadHash: string,
  configHash: string,
): boolean {
  if (entry.kind !== 'project') return false;
  if (entry.payloadContentHash !== payloadHash) return false;
  if (entry.configHash !== undefined && entry.configHash !== configHash) return false;
  return true;
}

/**
 * Finds the newest `share.json` row for the same worker origin + payload/config hashes.
 */
export function projectShareEpochMatchesCachedEntry(
  entry: ShareCacheEntry,
  configHash: string,
  inputFilesEpoch: string,
): boolean {
  if (entry.kind !== 'project') return false;
  if (entry.configHash !== configHash) return false;
  if (entry.inputFilesEpoch !== inputFilesEpoch) return false;
  return true;
}

/**
 * Newest project row for the same worker + config + tracked-files epoch (skips zip rebuild).
 */
export function findMatchingProjectShareEntryByFilesEpoch(
  entries: readonly ShareCacheEntry[],
  workerBaseUrl: string,
  configHash: string,
  inputFilesEpoch: string,
): ShareCacheEntry | undefined {
  const base = normalizeWorkerBaseUrl(workerBaseUrl);
  const hits = entries.filter(
    (e) =>
      e.kind === 'project' &&
      normalizeWorkerBaseUrl(e.workerBaseUrl) === base &&
      Boolean(e.workerProjectId) &&
      projectShareEpochMatchesCachedEntry(e, configHash, inputFilesEpoch),
  );
  if (hits.length === 0) return undefined;
  hits.sort((a, b) => (a.lastUsedAt < b.lastUsedAt ? 1 : -1));
  return hits[0];
}

export function findMatchingProjectShareEntry(
  entries: readonly ShareCacheEntry[],
  workerBaseUrl: string,
  payloadHash: string,
  configHash: string,
): ShareCacheEntry | undefined {
  const base = normalizeWorkerBaseUrl(workerBaseUrl);
  const hits = entries.filter(
    (e) =>
      e.kind === 'project' &&
      normalizeWorkerBaseUrl(e.workerBaseUrl) === base &&
      Boolean(e.workerProjectId) &&
      projectPayloadMatchesCachedEntry(e, payloadHash, configHash),
  );
  if (hits.length === 0) return undefined;
  hits.sort((a, b) => (a.lastUsedAt < b.lastUsedAt ? 1 : -1));
  return hits[0];
}

/**
 * Finds the newest report row for the same worker origin + payload hash.
 */
export function findMatchingReportShareEntry(
  entries: readonly ShareCacheEntry[],
  workerBaseUrl: string,
  payloadHash: string,
): ShareCacheEntry | undefined {
  const base = normalizeWorkerBaseUrl(workerBaseUrl);
  const hits = entries.filter(
    (e) =>
      e.kind === 'report' &&
      normalizeWorkerBaseUrl(e.workerBaseUrl) === base &&
      Boolean(e.workerReportId) &&
      e.payloadContentHash === payloadHash,
  );
  if (hits.length === 0) return undefined;
  hits.sort((a, b) => (a.lastUsedAt < b.lastUsedAt ? 1 : -1));
  return hits[0];
}
