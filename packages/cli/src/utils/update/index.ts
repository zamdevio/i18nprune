import { CLI_NAME, CLI_VERSION } from '@/constants/cli.js';
import {
  NPM_REGISTRY_LATEST_URL,
  UPDATE_CHECK_INTERVAL_MS,
  UPDATE_STATE_SCHEMA_VERSION,
} from '@/constants/update.js';
import { ENV_CI, ENV_I18NPRUNE_NO_UPDATE_CHECK } from '@/constants/env.js';
import {
  msSinceLastAttempt,
  readUpdateState,
  writeUpdateState,
  type UpdateStateFile,
} from './cache.js';
import { fetchLatestPublishedVersion, isPublishedVersionNewer } from './registry.js';

export { fetchLatestPublishedVersion, isPublishedVersionNewer } from './registry.js';
export {
  NPM_REGISTRY_LATEST_URL,
  UPDATE_CHECK_INTERVAL_MS,
  UPDATE_STATE_SCHEMA_VERSION,
} from '@/constants/update.js';
export {
  getI18npruneConfigDir,
  getUpdateCacheFilePath,
  getUpdateStateFilePath,
} from './paths.js';
export {
  readUpdateCache,
  readUpdateState,
  resetUpdateState,
  writeUpdateState,
  msSinceLastAttempt,
  type UpdateCacheFile,
  type UpdateStateFile,
} from './cache.js';
export {
  printCurrentVersionLine,
  printLatestVersionLine,
  runVersionCheckCommand,
  runVersionResetCommand,
  VERSION_OUTPUT_UNGATED,
} from './version.js';

function truthyEnv(v: string | undefined): boolean {
  if (v === undefined) return false;
  const x = v.trim().toLowerCase();
  return x === '1' || x === 'true' || x === 'yes';
}

function ciLike(): boolean {
  return truthyEnv(process.env[ENV_CI]);
}

/** Skip registry lookup (opt-out or CI — avoids noise and extra network in pipelines). */
export function shouldSkipUpdateCheck(): boolean {
  if (truthyEnv(process.env[ENV_I18NPRUNE_NO_UPDATE_CHECK])) return true;
  if (ciLike()) return true;
  return false;
}

/**
 * If due (24h since last attempt), fetch npm `latest` and refresh state. Swallows all errors.
 * Skipped when **`I18NPRUNE_NO_UPDATE_CHECK`**, **`CI`**, or global **`--json`** (machine output).
 */
export async function ensureUpdateCacheRefreshed(opts: {
  jsonOutput: boolean;
  force?: boolean;
}): Promise<void> {
  if (opts.jsonOutput) return;
  if (shouldSkipUpdateCheck()) return;

  const now = Date.now();
  const cache = readUpdateState(NPM_REGISTRY_LATEST_URL);
  if (!opts.force && msSinceLastAttempt(cache, now) < UPDATE_CHECK_INTERVAL_MS) {
    return;
  }

  let latest: string | null = null;
  try {
    latest = await fetchLatestPublishedVersion();
  } catch {
    latest = null;
  }

  const next: UpdateStateFile = {
    schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
    lastAttemptMs: now,
    lastSuccessMs: latest !== null ? now : cache.lastSuccessMs,
    latestRegistryVersion: latest !== null ? latest : cache.latestRegistryVersion,
    lastError: latest === null ? 'fetch_failed' : null,
    registryEndpoint: NPM_REGISTRY_LATEST_URL,
    cliVersionWhenRecorded: latest !== null ? CLI_VERSION : cache.cliVersionWhenRecorded,
  };
  try {
    writeUpdateState(next);
  } catch {
    /* ignore disk errors */
  }
}

/** Dim one-liner for under the banner when cache says a newer npm version exists. */
export function formatCachedUpdateBannerLine(): string | null {
  if (shouldSkipUpdateCheck()) return null;
  const cache = readUpdateState(NPM_REGISTRY_LATEST_URL);
  const latest = cache.latestRegistryVersion;
  if (!latest) return null;
  if (!isPublishedVersionNewer(latest, CLI_VERSION)) return null;
  return `${CLI_NAME} ${CLI_VERSION} (update available ${latest})`;
}
