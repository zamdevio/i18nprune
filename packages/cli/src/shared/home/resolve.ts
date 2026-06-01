import os from 'node:os';
import path from 'node:path';
import { ENV_I18NPRUNE_HOME } from '@/constants/env.js';

const DEFAULT_HOME_DIRNAME = '.i18nprune' as const;

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

/** Pre-consolidation paths (read once for lazy migration). */
export function legacyVersionStateFilePaths(): string[] {
  const out: string[] = [];
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg !== undefined && xdg.trim().length > 0) {
    out.push(path.join(xdg.trim(), 'i18nprune', 'updatestate.json'));
  }
  const homedirConfig = path.join(os.homedir(), '.config', 'i18nprune', 'updatestate.json');
  if (!out.includes(homedirConfig)) {
    out.push(homedirConfig);
  }
  return out;
}
