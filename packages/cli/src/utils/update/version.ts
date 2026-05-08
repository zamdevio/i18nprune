import { CLI_VERSION } from '@/constants/cli.js';
import { NPM_REGISTRY_LATEST_URL, UPDATE_STATE_SCHEMA_VERSION } from '@/constants/update.js';
import { ENV_I18NPRUNE_NO_UPDATE_CHECK } from '@/constants/env.js';
import type { LoggerMask } from '@/types/core/logger/index.js';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { logger } from '@/utils/logger/index.js';
import { style } from '@/utils/style/index.js';
import { readUpdateState, resetUpdateState, writeUpdateState } from './cache.js';
import { fetchLatestPublishedVersion, isPublishedVersionNewer } from './registry.js';

/**
 * Version subcommand output that must stay visible even when global **`-q` / `-s`** are set
 * (registry check / current line would otherwise be empty or misleading).
 */
export const VERSION_OUTPUT_UNGATED: LoggerMask = { quiet: false, silent: false };

/** Styled `Current: <semver>` via **`logger.info`** (grep-friendly `[i18nprune] [info]` prefix). */
export function printCurrentVersionLine(run: RunOptions): void {
  const msg = `${style.dim('Current:')} ${style.bold(style.ok(CLI_VERSION))}`;
  logger.info(msg, run, VERSION_OUTPUT_UNGATED);
}

/** Styled `Latest on npm: <semver>` for **`version --check`**. */
export function printLatestVersionLine(latest: string, run: RunOptions): void {
  const msg = `${style.dim('Latest on npm:')} ${style.bold(style.ok(latest))}`;
  logger.info(msg, run, VERSION_OUTPUT_UNGATED);
}

function truthyEnv(v: string | undefined): boolean {
  if (v === undefined) return false;
  const x = v.trim().toLowerCase();
  return x === '1' || x === 'true' || x === 'yes';
}

/** `version --reset` — clears cached update check (info line respects **`-q` / `-s`**). */
export async function runVersionResetCommand(run: RunOptions): Promise<void> {
  resetUpdateState();
  logger.info('Cleared cached npm update check. Next run will look up the latest version again.', run);
}

/**
 * `i18nprune version --check` — queries the registry (unless opt-out), updates state on success or failure.
 */
export async function runVersionCheckCommand(run: RunOptions): Promise<void> {
  if (truthyEnv(process.env[ENV_I18NPRUNE_NO_UPDATE_CHECK])) {
    logger.warn(
      `Update check skipped (${ENV_I18NPRUNE_NO_UPDATE_CHECK} is set).`,
      run,
      VERSION_OUTPUT_UNGATED,
    );
    printCurrentVersionLine(run);
    return;
  }

  const now = Date.now();
  const prev = readUpdateState(NPM_REGISTRY_LATEST_URL);
  const latest = await fetchLatestPublishedVersion();

  if (!latest) {
    writeUpdateState({
      schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
      lastAttemptMs: now,
      lastSuccessMs: prev.lastSuccessMs,
      latestRegistryVersion: prev.latestRegistryVersion,
      lastError: 'fetch_failed',
      registryEndpoint: NPM_REGISTRY_LATEST_URL,
      cliVersionWhenRecorded: prev.cliVersionWhenRecorded,
    });
    logger.warn(
      'Could not fetch latest version from the npm registry (offline or unexpected response).',
      run,
      VERSION_OUTPUT_UNGATED,
    );
    printCurrentVersionLine(run);
    return;
  }

  writeUpdateState({
    schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
    lastAttemptMs: now,
    lastSuccessMs: now,
    latestRegistryVersion: latest,
    lastError: null,
    registryEndpoint: NPM_REGISTRY_LATEST_URL,
    cliVersionWhenRecorded: CLI_VERSION,
  });

  printCurrentVersionLine(run);
  printLatestVersionLine(latest, run);
  if (isPublishedVersionNewer(latest, CLI_VERSION)) {
    logger.warn(
      'A newer version is available. Install globally: npm i -g i18nprune',
      run,
      VERSION_OUTPUT_UNGATED,
    );
  } else {
    logger.info('You are on the latest published version.', run, VERSION_OUTPUT_UNGATED);
  }
}
