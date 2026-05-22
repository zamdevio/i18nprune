import { CLI_VERSION } from '@/constants/cli.js';
import {
  NPM_REGISTRY_LATEST_URL,
  UPDATE_CHECK_INTERVAL_MS,
  UPDATE_STATE_SCHEMA_VERSION,
} from '@/constants/update.js';
import {
  msSinceLastAttempt,
  readUpdateState,
  writeUpdateState,
  type UpdateStateFile,
} from './cache.js';
import { fetchLatestPublishedVersion } from './registry.js';
import { shouldSkipUpdateCheck } from './skipPolicy.js';

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
