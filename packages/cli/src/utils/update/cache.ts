import { UPDATE_STATE_SCHEMA_VERSION } from '@/constants/update.js';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { readJsonFromRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';

import { legacyVersionStateFilePaths } from '@/shared/home/index.js';
import { ensureConfigDirExists, getUpdateStateFilePath } from './paths.js';
const nodeFs = createNodeRuntimeAdapters().fs;

export type UpdateStateFile = {
  schemaVersion: typeof UPDATE_STATE_SCHEMA_VERSION;
  /** Unix ms of last fetch attempt (success or failure). */
  lastAttemptMs: number;
  /** Unix ms of last successful registry read + parse, or null if never succeeded. */
  lastSuccessMs: number | null;
  /** Semver string from registry `latest`, or null if unknown / fetch failed. */
  latestRegistryVersion: string | null;
  /** Short machine-readable reason if the last attempt failed; null on success. */
  lastError: string | null;
  /** Registry URL used for the fetch (for support / debugging). */
  registryEndpoint: string;
  /** CLI version string at time of last successful write (from package.json). */
  cliVersionWhenRecorded: string | null;
};

export function msSinceLastAttempt(state: UpdateStateFile, nowMs: number): number {
  return nowMs - state.lastAttemptMs;
}

function emptyState(registryEndpoint: string): UpdateStateFile {
  return {
    schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
    lastAttemptMs: 0,
    lastSuccessMs: null,
    latestRegistryVersion: null,
    lastError: null,
    registryEndpoint,
    cliVersionWhenRecorded: null,
  };
}

function parseV1(raw: unknown, registryEndpoint: string): UpdateStateFile | null {
  if (raw === null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== UPDATE_STATE_SCHEMA_VERSION) return null;
  const lastAttemptMs =
    typeof o.lastAttemptMs === 'number' && Number.isFinite(o.lastAttemptMs)
      ? o.lastAttemptMs
      : 0;
  const lastSuccessMs =
    o.lastSuccessMs === null
      ? null
      : typeof o.lastSuccessMs === 'number' && Number.isFinite(o.lastSuccessMs)
        ? o.lastSuccessMs
        : null;
  const latest =
    o.latestRegistryVersion === null
      ? null
      : typeof o.latestRegistryVersion === 'string' && o.latestRegistryVersion.trim()
        ? o.latestRegistryVersion.trim()
        : null;
  const lastError =
    o.lastError === null || o.lastError === undefined
      ? null
      : typeof o.lastError === 'string'
        ? o.lastError
        : null;
  const ep =
    typeof o.registryEndpoint === 'string' && o.registryEndpoint.trim()
      ? o.registryEndpoint.trim()
      : registryEndpoint;
  const cliVer =
    o.cliVersionWhenRecorded === null || o.cliVersionWhenRecorded === undefined
      ? null
      : typeof o.cliVersionWhenRecorded === 'string'
        ? o.cliVersionWhenRecorded
        : null;
  return {
    schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
    lastAttemptMs,
    lastSuccessMs,
    latestRegistryVersion: latest,
    lastError,
    registryEndpoint: ep,
    cliVersionWhenRecorded: cliVer,
  };
}

function readParsedState(filePath: string, registryEndpoint: string): UpdateStateFile | null {
  try {
    const parsed = readJsonFromRuntimeFsSync(filePath, nodeFs);
    return parseV1(parsed, registryEndpoint);
  } catch {
    return null;
  }
}

/**
 * Read version throttle state from `<home>/state/version.json`, or legacy `updatestate.json` paths.
 * Lazy-migrates legacy files to the new location on first successful read.
 * Does **not** create directories or files — first `writeUpdateState` does that.
 */
export function readUpdateState(registryEndpoint: string): UpdateStateFile {
  const canonical = getUpdateStateFilePath();
  const candidates = [canonical, ...legacyVersionStateFilePaths()];
  const seen = new Set<string>();

  for (const filePath of candidates) {
    if (seen.has(filePath)) continue;
    seen.add(filePath);
    const state = readParsedState(filePath, registryEndpoint);
    if (state === null) continue;
    if (filePath !== canonical) {
      try {
        writeUpdateState(state);
      } catch {
        /* ignore migration write errors */
      }
    }
    return state;
  }

  return emptyState(registryEndpoint);
}

/** Persists state under `<home>/state/version.json` (`mkdir` recursive). */
export function writeUpdateState(state: UpdateStateFile): void {
  ensureConfigDirExists();
  const path = getUpdateStateFilePath();
  nodeFs.writeText(path, `${JSON.stringify(state, null, 2)}\n`);
}

/** Remove canonical and legacy version state files so the next run treats the throttle as fresh. */
export function resetUpdateState(): void {
  const paths = [getUpdateStateFilePath(), ...legacyVersionStateFilePaths()];
  const seen = new Set<string>();
  for (const filePath of paths) {
    if (seen.has(filePath)) continue;
    seen.add(filePath);
    try {
      nodeFs.deleteFile(filePath);
    } catch {
      /* ignore */
    }
  }
}
