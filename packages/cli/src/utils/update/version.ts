import { CLI_VERSION } from '@/constants/cli.js';
import { SDK_PACKAGE_NAME, SDK_VERSION } from '@i18nprune/core';
import { NPM_REGISTRY_LATEST_URL, UPDATE_STATE_SCHEMA_VERSION } from '@/constants/update.js';
import { ENV_I18NPRUNE_NO_UPDATE_CHECK } from '@/constants/env.js';
import type { LoggerMask } from '@/types/core/logger/index.js';
import type { RunOptions } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import { style } from '@/utils/style/index.js';
import { readUpdateState, resetUpdateState, writeUpdateState } from './cache.js';
import { printGlobalInstallHints, VERSION_UNKNOWN } from './installHint.js';
import { fetchLatestPublishedVersion, isPublishedVersionNewer } from './registry.js';

/**
 * Version subcommand output that must stay visible even when global **`-q` / `-s`** are set
 * (registry check / current line would otherwise be empty or misleading).
 */
export const VERSION_OUTPUT_UNGATED: LoggerMask = { quiet: false, silent: false };

/** Human `Latest CLI:` line for **`version --check`**. */
export function formatLatestCliLine(latest: string | null, current: string): string {
  if (!latest) {
    return `${style.dim('Latest CLI:')} ${style.dim(VERSION_UNKNOWN)}`;
  }
  const value = `${style.dim('Latest CLI:')} ${style.bold(style.ok(latest))}`;
  if (!isPublishedVersionNewer(latest, current)) {
    return `${value} ${style.dim('(up to date)')}`;
  }
  return value;
}

/** Styled CLI + SDK version lines via **`logger.info`** (grep-friendly `[i18nprune] [info]` prefix). */
export function printCurrentVersionLine(run: RunOptions): void {
  const cliLine = `${style.dim('Current CLI:')} ${style.bold(style.ok(CLI_VERSION))}`;
  const sdkLine = `${style.dim('SDK:')} ${style.bold(style.ok(SDK_VERSION))} ${style.dim(`(${SDK_PACKAGE_NAME})`)}`;
  logger.info(cliLine, run, VERSION_OUTPUT_UNGATED);
  logger.info(sdkLine, run, VERSION_OUTPUT_UNGATED);
}

/** Full **`version --check`** report (current, latest, optional update notice + install hint). */
export function printVersionCheckReport(run: RunOptions, latest: string | null): void {
  if (latest && isPublishedVersionNewer(latest, CLI_VERSION)) {
    logger.notice(
      `Update available: ${CLI_VERSION} → ${latest}`,
      run,
      VERSION_OUTPUT_UNGATED,
    );
  }

  logger.info(
    `${style.dim('Current CLI:')} ${style.bold(style.ok(CLI_VERSION))}`,
    run,
    VERSION_OUTPUT_UNGATED,
  );
  logger.info(formatLatestCliLine(latest, CLI_VERSION), run, VERSION_OUTPUT_UNGATED);

  if (latest && isPublishedVersionNewer(latest, CLI_VERSION)) {
    printGlobalInstallHints(run, VERSION_OUTPUT_UNGATED, 'info');
  }

  const sdkLine = `${style.dim('SDK:')} ${style.bold(style.ok(SDK_VERSION))} ${style.dim(`(${SDK_PACKAGE_NAME})`)}`;
  logger.info(sdkLine, run, VERSION_OUTPUT_UNGATED);
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
    printVersionCheckReport(run, null);
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

  printVersionCheckReport(run, latest);
}
