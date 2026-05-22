import type { CacheProjectFileRecord } from '../types/cache/index.js';
import { computeInputFilesEpoch } from './engine.js';

/** SHA-256 of an empty tracked-files map (canonical empty string). Not a valid share/cache epoch. */
export const EMPTY_INPUT_FILES_EPOCH =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' as const;

export function isEmptyInputFilesEpoch(epoch: string | undefined): boolean {
  return epoch === EMPTY_INPUT_FILES_EPOCH;
}

export function isTrackedFilesMapEmpty(files: Record<string, CacheProjectFileRecord>): boolean {
  return Object.keys(files).length === 0;
}

/** True when the digest would be the empty-map sentinel (no tracked files). */
export function wouldComputeEmptyInputFilesEpoch(
  files: Record<string, CacheProjectFileRecord>,
  hashText?: (text: string) => string,
): boolean {
  if (isTrackedFilesMapEmpty(files)) return true;
  return isEmptyInputFilesEpoch(computeInputFilesEpoch(files, hashText));
}
