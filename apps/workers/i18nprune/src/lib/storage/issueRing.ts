import {
  STORAGE_PRESSURE_FAILURE_THRESHOLD,
  STORAGE_PRESSURE_RING_MAX,
} from '../constants/storagePressure.js';
import { storageErrorSignature } from './detect.js';

export type StorageFailureRingEntry = {
  signature: string;
  at: string;
};

export const OPS_STORAGE_RING_KEY = 'ops:storage:ring';

export function appendStorageFailure(
  ring: StorageFailureRingEntry[],
  err: unknown,
): StorageFailureRingEntry[] {
  const next = [...ring, { signature: storageErrorSignature(err), at: new Date().toISOString() }];
  if (next.length <= STORAGE_PRESSURE_RING_MAX) return next;
  return next.slice(-STORAGE_PRESSURE_RING_MAX);
}

/** True when the last N failures share one signature (confirmed recurring pressure). */
export function shouldTriggerStorageEviction(ring: StorageFailureRingEntry[]): boolean {
  if (ring.length < STORAGE_PRESSURE_FAILURE_THRESHOLD) return false;
  const tail = ring.slice(-STORAGE_PRESSURE_FAILURE_THRESHOLD);
  const sig = tail[0]?.signature;
  if (!sig) return false;
  return tail.every((e) => e.signature === sig);
}
