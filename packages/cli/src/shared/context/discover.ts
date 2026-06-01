import path from 'node:path';
import { existsRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';
import type { RuntimeFsPort } from '@i18nprune/core';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type { DiscoveryResult } from '@/types/core/discovery/index.js';

/** Heuristic: if `locales/en.json` exists and source still default, suggest it. */
export function runDiscovery(config: I18nPruneConfig, cwd = process.cwd(), fsPort: RuntimeFsPort): DiscoveryResult {
  const warnings: string[] = [];
  const patch: Partial<I18nPruneConfig> = {};
  const en = path.join(cwd, 'locales', 'en.json');
  if (existsRuntimeFsSync(en, fsPort) && config.locales.source === 'en') {
    /* already aligned */
  }
  if (
    !existsRuntimeFsSync(path.resolve(cwd, config.locales.directory), fsPort) &&
    existsRuntimeFsSync(path.join(cwd, 'locales'), fsPort)
  ) {
    patch.locales = { ...config.locales, directory: 'locales' };
    warnings.push(`locales.directory "${config.locales.directory}" missing; using "locales" if present`);
  }
  return { patch, warnings };
}
