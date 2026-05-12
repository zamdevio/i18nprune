import os from 'node:os';
import path from 'node:path';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

const UPDATE_STATE_BASENAME = 'updatestate.json' as const;
const nodeFs = createNodeRuntimeAdapters().fs;

function getConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg && xdg.trim()) return path.join(xdg.trim(), 'i18nprune');
  return path.join(os.homedir(), '.config', 'i18nprune');
}

export function getUpdateStateFilePath(): string {
  return path.join(getConfigDir(), UPDATE_STATE_BASENAME);
}

export function ensureConfigDirExists(): void {
  const dir = path.dirname(getUpdateStateFilePath());
  nodeFs.mkdirp(dir);
}
