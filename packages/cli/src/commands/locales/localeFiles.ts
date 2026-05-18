import type { RuntimeFsPort } from '@i18nprune/core';
import { existsRuntimeFsSync, listRuntimeFsDirSync } from '@i18nprune/core';

/** Basenames without `.json` for root-level locale JSON files. */
export function listLocaleJsonSlugs(absLocalesDir: string, fs: RuntimeFsPort): string[] {
  if (!existsRuntimeFsSync(absLocalesDir, fs)) return [];
  try {
    return listRuntimeFsDirSync(absLocalesDir, fs)
      .filter((e) => e.kind === 'file' && e.name.endsWith('.json'))
      .map((e) => e.name.slice(0, -'.json'.length))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}
