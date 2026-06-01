import os from 'node:os';
import path from 'node:path';
import { ENV_I18NPRUNE_HOME } from '@/constants/env.js';

const DEFAULT_HOME_DIRNAME = '.i18nprune' as const;

/**
 * CLI machine-local layout (default `~/.i18nprune`, or `I18NPRUNE_HOME`):
 * - `<home>/cache/` — project + analysis + translate cache
 * - `<home>/state/version.json` — npm registry throttle (CLI only)
 */

/** Default `~/.i18nprune` (or `%USERPROFILE%\.i18nprune` on Windows). */
export function defaultI18nPruneHomeDir(): string {
  return path.join(os.homedir(), DEFAULT_HOME_DIRNAME);
}

/** Resolved CLI home root (`I18NPRUNE_HOME` or default). */
export function resolveI18nPruneHomeDir(): string {
  const raw = process.env[ENV_I18NPRUNE_HOME];
  if (raw !== undefined && raw.trim().length > 0) {
    return path.resolve(raw.trim());
  }
  return defaultI18nPruneHomeDir();
}

/** True when `I18NPRUNE_HOME` is set to a non-empty path (custom home). */
export function isI18nPruneHomeOverridden(): boolean {
  const raw = process.env[ENV_I18NPRUNE_HOME];
  return raw !== undefined && raw.trim().length > 0;
}

/** Project + analysis + translate cache root (`<home>/cache`). */
export function resolveI18nPruneCacheRootDir(): string {
  return path.join(resolveI18nPruneHomeDir(), 'cache');
}

/** npm version throttle state (`<home>/state/version.json`). */
export function resolveVersionStateFilePath(): string {
  return path.join(resolveI18nPruneHomeDir(), 'state', 'version.json');
}
