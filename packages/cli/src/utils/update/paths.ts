import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const UPDATE_STATE_BASENAME = 'updatestate.json' as const;

function getConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg && xdg.trim()) return path.join(xdg.trim(), 'i18nprune');
  return path.join(os.homedir(), '.config', 'i18nprune');
}

/**
 * Path to the on-disk update state file (rich JSON: last check, registry version, errors).
 * Uses XDG: `$XDG_CONFIG_HOME/i18nprune/updatestate.json` or `~/.config/i18nprune/updatestate.json`.
 */
export function getI18npruneConfigDir(): string {
  return getConfigDir();
}

export function getUpdateStateFilePath(): string {
  return path.join(getConfigDir(), UPDATE_STATE_BASENAME);
}

/** @deprecated use getUpdateStateFilePath */
export function getUpdateCacheFilePath(): string {
  return getUpdateStateFilePath();
}

export function ensureConfigDirExists(): void {
  const dir = path.dirname(getUpdateStateFilePath());
  fs.mkdirSync(dir, { recursive: true });
}
