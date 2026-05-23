import type { ProjectStoreRow, ReportStoreRow } from '@i18nprune/core';
import {
  DO_PREFIX_PROJECT,
  DO_PREFIX_PROJECT_HASH,
  DO_PREFIX_REPORT,
  DO_PREFIX_REPORT_HASH,
  OPS_STORAGE_RING_KEY,
} from '../constants/storageKeys.js';
import { STORAGE_PRESSURE_EVICTION_FRACTION } from '../constants/storagePressure.js';
import {
  appendStorageFailure,
  shouldTriggerStorageEviction,
  type StorageFailureRingEntry,
} from './issueRing.js';
import { isDurableObjectStorageError } from './detect.js';
import {
  pickEvictionTargets,
  projectRowSizeBytes,
  reportRowSizeBytes,
  rowLastAccessedMs,
  type EvictionCandidate,
} from './eviction.js';

export class StoragePressureError extends Error {
  readonly code = 'STORAGE_QUOTA_EXCEEDED' as const;
  readonly evictionAttempted: boolean;

  constructor(message: string, evictionAttempted: boolean) {
    super(message);
    this.name = 'StoragePressureError';
    this.evictionAttempted = evictionAttempted;
  }
}

async function listPrefix<T>(state: DurableObjectState, prefix: string): Promise<Array<{ key: string; row: T }>> {
  const out: Array<{ key: string; row: T }> = [];
  let startAfter: string | undefined;
  for (;;) {
    const map = await state.storage.list<T>({
      prefix,
      limit: 64,
      ...(startAfter ? { startAfter } : {}),
    });
    if (map.size === 0) break;
    let lastKey: string | undefined;
    for (const [key, row] of map) {
      lastKey = key;
      out.push({ key, row });
    }
    if (map.size < 64) break;
    if (!lastKey) break;
    startAfter = lastKey;
  }
  return out;
}

export async function collectEvictionCandidates(state: DurableObjectState): Promise<EvictionCandidate[]> {
  const candidates: EvictionCandidate[] = [];

  for (const { key, row } of await listPrefix<ProjectStoreRow>(state, DO_PREFIX_PROJECT)) {
    candidates.push({
      kind: 'project',
      rowKey: key,
      hashKey: `${DO_PREFIX_PROJECT_HASH}${row.projectHash}`,
      lastAccessedMs: rowLastAccessedMs(row),
      sizeBytes: projectRowSizeBytes(row),
    });
  }

  for (const { key, row } of await listPrefix<ReportStoreRow>(state, DO_PREFIX_REPORT)) {
    candidates.push({
      kind: 'report',
      rowKey: key,
      hashKey: `${DO_PREFIX_REPORT_HASH}${row.payloadContentHash}`,
      lastAccessedMs: rowLastAccessedMs(row),
      sizeBytes: reportRowSizeBytes(row),
    });
  }

  return candidates;
}

export async function runStoragePressureEviction(state: DurableObjectState): Promise<{
  deletedProjects: number;
  deletedReports: number;
}> {
  const targets = pickEvictionTargets(
    await collectEvictionCandidates(state),
    STORAGE_PRESSURE_EVICTION_FRACTION,
  );

  let deletedProjects = 0;
  let deletedReports = 0;

  for (const t of targets) {
    await state.storage.delete(t.rowKey);
    await state.storage.delete(t.hashKey);
    if (t.kind === 'project') deletedProjects += 1;
    else deletedReports += 1;
  }

  return { deletedProjects, deletedReports };
}

export async function readStorageFailureRing(state: DurableObjectState): Promise<StorageFailureRingEntry[]> {
  const raw = await state.storage.get<StorageFailureRingEntry[]>(OPS_STORAGE_RING_KEY);
  return Array.isArray(raw) ? raw : [];
}

export async function writeStorageFailureRing(
  state: DurableObjectState,
  ring: StorageFailureRingEntry[],
): Promise<void> {
  await state.storage.put(OPS_STORAGE_RING_KEY, ring);
}

/**
 * Records a storage failure; after {@link STORAGE_PRESSURE_FAILURE_THRESHOLD} matching signatures,
 * evicts ~25% of `project:*` / `report:*` rows (never `ratelimit:*` or `ops:*`).
 */
export async function handleStoragePutFailure(state: DurableObjectState, err: unknown): Promise<boolean> {
  if (!isDurableObjectStorageError(err)) return false;

  const ring = appendStorageFailure(await readStorageFailureRing(state), err);
  await writeStorageFailureRing(state, ring);

  if (!shouldTriggerStorageEviction(ring)) return false;

  await runStoragePressureEviction(state);
  await writeStorageFailureRing(state, []);
  return true;
}

export async function putWithStorageRecovery(
  state: DurableObjectState,
  key: string,
  value: unknown,
): Promise<void> {
  try {
    await state.storage.put(key, value);
  } catch (err) {
    if (!isDurableObjectStorageError(err)) throw err;
    const recovered = await handleStoragePutFailure(state, err);
    if (!recovered) {
      throw new StoragePressureError(
        err instanceof Error ? err.message : 'Durable Object storage limit reached.',
        false,
      );
    }
    try {
      await state.storage.put(key, value);
    } catch (retryErr) {
      throw new StoragePressureError(
        retryErr instanceof Error ? retryErr.message : 'Storage still full after pressure eviction.',
        true,
      );
    }
  }
}
