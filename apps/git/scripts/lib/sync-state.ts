import fs from 'node:fs';
import path from 'node:path';
import { CACHE_DIR, SYNC_STATE_FILE } from './cache-dir.js';
import { DATA_DIR } from './paths.js';
import { git } from './git.js';

export const SYNC_OUTPUT_FILES = [
  'commits.json',
  'summary.json',
  'phases.json',
  'authors.json',
  'tags.json',
  'branches.json',
] as const;

export type GitSyncFingerprint = {
  headSha: string;
  commitCount: number;
  fingerprint: string;
};

export type GitSyncState = {
  syncedAt: string;
  headSha: string;
  commitCount: number;
  fingerprint: string;
};

function syncStatePath(): string {
  return path.join(CACHE_DIR, SYNC_STATE_FILE);
}

export function computeGitFingerprint(): GitSyncFingerprint {
  const headSha = git(['rev-parse', 'HEAD']);
  const commitCount = Number.parseInt(git(['rev-list', '--count', 'HEAD']), 10);
  if (!Number.isFinite(commitCount) || commitCount < 0) {
    throw new Error('git rev-list --count returned an invalid value');
  }
  return {
    headSha,
    commitCount,
    fingerprint: `${headSha}:${commitCount}`,
  };
}

export function allSyncOutputsExist(): boolean {
  return SYNC_OUTPUT_FILES.every((name) => fs.existsSync(path.join(DATA_DIR, name)));
}

export function loadSyncState(): GitSyncState | null {
  const filePath = syncStatePath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as GitSyncState;
    if (
      typeof parsed.syncedAt !== 'string' ||
      typeof parsed.headSha !== 'string' ||
      typeof parsed.fingerprint !== 'string' ||
      typeof parsed.commitCount !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSyncState(fp: GitSyncFingerprint): void {
  const state: GitSyncState = {
    syncedAt: new Date().toISOString(),
    headSha: fp.headSha,
    commitCount: fp.commitCount,
    fingerprint: fp.fingerprint,
  };
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(syncStatePath(), `${JSON.stringify(state, null, 2)}\n`);
}

export function clearSyncState(): void {
  const filePath = syncStatePath();
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

/** Prior sync state when HEAD/count unchanged, outputs exist, and not `--force`; else `null`. */
export function shouldSkipSync(force: boolean, fp: GitSyncFingerprint): GitSyncState | null {
  if (force) return null;
  if (!allSyncOutputsExist()) return null;
  const state = loadSyncState();
  if (!state) return null;
  if (state.fingerprint !== fp.fingerprint) return null;
  return state;
}
