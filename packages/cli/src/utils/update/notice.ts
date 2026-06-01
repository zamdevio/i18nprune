import { CLI_VERSION } from '@/constants/cli.js';
import { NPM_REGISTRY_LATEST_URL, UPDATE_STATE_SCHEMA_VERSION } from '@/constants/update.js';
import type { RunOptions } from '@i18nprune/core';
import { canEmit } from '@/utils/logger/policy.js';
import { style } from '@/utils/ansi/index.js';
import { logger } from '@/utils/logger/index.js';
import { readUpdateState, writeUpdateState } from './cache.js';
import { printGlobalInstallHints } from './installHint.js';
import { shouldSkipUpdateCheck } from './skipPolicy.js';
import { fetchLatestPublishedVersion, isPublishedVersionNewer } from './registry.js';

export type UpdateNoticeResolution = {
  show: boolean;
  /** Live registry read succeeded for this resolution. */
  registryVerified: boolean;
  latest: string | null;
};

function normalizeSemverLabel(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
}

/**
 * Decide whether to show a post-banner update notice and whether the registry confirmed it.
 * Uses cached `latestRegistryVersion` first; optionally confirms with npm when an update may exist.
 */
export async function resolveUpdateNotice(): Promise<UpdateNoticeResolution> {
  if (shouldSkipUpdateCheck()) {
    return { show: false, registryVerified: false, latest: null };
  }

  const cache = readUpdateState(NPM_REGISTRY_LATEST_URL);
  const cached = normalizeSemverLabel(cache.latestRegistryVersion);
  if (!cached || !isPublishedVersionNewer(cached, CLI_VERSION)) {
    return { show: false, registryVerified: false, latest: null };
  }

  const live = await fetchLatestPublishedVersion();
  if (!live) {
    return { show: true, registryVerified: false, latest: cached };
  }

  const liveNorm = normalizeSemverLabel(live);
  if (!liveNorm || !isPublishedVersionNewer(liveNorm, CLI_VERSION)) {
    const now = Date.now();
    try {
      writeUpdateState({
        schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
        lastAttemptMs: now,
        lastSuccessMs: now,
        latestRegistryVersion: liveNorm,
        lastError: null,
        registryEndpoint: NPM_REGISTRY_LATEST_URL,
        cliVersionWhenRecorded: CLI_VERSION,
      });
    } catch {
      /* ignore disk errors */
    }
    return { show: false, registryVerified: true, latest: liveNorm };
  }

  if (liveNorm !== cached) {
    const now = Date.now();
    try {
      writeUpdateState({
        schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
        lastAttemptMs: now,
        lastSuccessMs: now,
        latestRegistryVersion: liveNorm,
        lastError: null,
        registryEndpoint: NPM_REGISTRY_LATEST_URL,
        cliVersionWhenRecorded: CLI_VERSION,
      });
    } catch {
      /* ignore disk errors */
    }
  }

  return { show: true, registryVerified: true, latest: liveNorm };
}

/**
 * Post-command-header update notice (central hook from {@link maybePrintCommandBanner}).
 * Skipped for **`version`**, when notice gate is off, or when there is no known newer semver.
 */
export async function maybePrintUpdateNoticeAfterBanner(
  run: RunOptions,
  commandPath: string,
): Promise<void> {
  if (commandPath === 'version') return;
  if (!canEmit(run, 'notice')) return;

  const resolution = await resolveUpdateNotice();
  const latest = normalizeSemverLabel(resolution.latest);
  if (!resolution.show || !latest) return;

  logger.notice(
    `${style.warn('▲')} Update available: ${CLI_VERSION} → ${latest}`,
    run,
  );
  if (!resolution.registryVerified) {
    logger.notice('Could not verify with npm — showing cached latest.', run);
  }
  printGlobalInstallHints(run);
}
