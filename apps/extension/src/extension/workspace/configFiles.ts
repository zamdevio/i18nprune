import path from 'node:path';
import { existsRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';
import type { RuntimeAdapters } from '@i18nprune/core';

const CONFIG_BASE = 'i18nprune.config';

export const CONFIG_FILE_NAMES = [
  `${CONFIG_BASE}.ts`,
  `${CONFIG_BASE}.js`,
  `${CONFIG_BASE}.mts`,
  `${CONFIG_BASE}.mjs`,
  `${CONFIG_BASE}.cts`,
  `${CONFIG_BASE}.cjs`,
] as const;

export function listDiscoveredConfigFiles(cwd: string, fs: RuntimeAdapters['fs']): string[] {
  const out: string[] = [];
  for (const name of CONFIG_FILE_NAMES) {
    const candidate = path.join(cwd, name);
    if (existsRuntimeFsSync(candidate, fs)) out.push(candidate);
  }
  return out;
}
