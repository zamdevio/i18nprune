import fs from 'node:fs';
import path from 'node:path';
import type { I18nPruneConfig } from '@/types/config/index.js';
import type { DiscoveryResult } from '@/types/core/discovery/index.js';

export type { DiscoveryResult };

/** Heuristic: if `locales/en.json` exists and source still default, suggest it. */
export function runDiscovery(config: I18nPruneConfig): DiscoveryResult {
  const warnings: string[] = [];
  const patch: Partial<I18nPruneConfig> = {};
  const cwd = process.cwd();
  const en = path.join(cwd, 'locales', 'en.json');
  if (fs.existsSync(en) && config.source === 'locales/en.json') {
    /* already aligned */
  }
  if (!fs.existsSync(path.resolve(cwd, config.localesDir)) && fs.existsSync(path.join(cwd, 'locales'))) {
    patch.localesDir = 'locales';
    warnings.push(`localesDir "${config.localesDir}" missing; using "locales" if present`);
  }
  return { patch, warnings };
}
