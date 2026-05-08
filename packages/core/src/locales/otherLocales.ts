import type { ProjectFilesystemRuntime } from '../types/runtime/capabilities.js';
import { existsRuntimeFsSync, listRuntimeFsDirSync } from '../runtime/helpers/sync/index.js';

/**
 * Basenames (without `.json`) of locale files under `localesDir`, excluding the source locale.
 * Ignores `*.meta.json`; only scans `*.json` in `localesDir`.
 */
export function listOtherLocaleCodes(
  runtime: ProjectFilesystemRuntime,
  localesDir: string,
  sourceBase: string,
): string[] {
  const { fs, path } = runtime;
  if (!existsRuntimeFsSync(localesDir, fs)) return [];
  return listRuntimeFsDirSync(localesDir, fs)
    .filter((e) => e.kind === 'file' && e.name.endsWith('.json') && !e.name.endsWith('.meta.json'))
    .map((e) => path.basename(e.name, '.json'))
    .filter((c) => c !== sourceBase);
}
