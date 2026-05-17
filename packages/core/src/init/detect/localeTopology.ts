import { assertSyncPortResult } from '../../runtime/helpers/sync/assert.js';
import { existsRuntimeFsSync } from '../../runtime/helpers/sync/index.js';
import type { InitFilesystemHost } from '../../types/init/index.js';
import type { InitTopologySignals } from '../../types/init/index.js';

const NEXT_CONFIG_NAMES = ['next.config.js', 'next.config.mjs', 'next.config.ts'] as const;

/** Relative directory roots commonly used for locale JSON trees. */
const LOCALE_ROOT_CANDIDATES = [
  'messages',
  'locales',
  'translations',
  'i18n',
  'lang',
  'public/locales',
] as const;

/**
 * Collect lightweight directory / framework markers under **`projectRoot`**.
 *
 * @remarks Uses **`fs.exists`** / **`statKind`** only — no locale JSON parsing.
 */
export function readInitTopologySignals(host: InitFilesystemHost, projectRoot: string): InitTopologySignals {
  const localeRoots: string[] = [];
  for (const rel of LOCALE_ROOT_CANDIDATES) {
    const abs = host.path.join(projectRoot, rel);
    if (!existsRuntimeFsSync(abs, host.fs)) continue;
    const kind = assertSyncPortResult(host.fs.statKind(abs), 'fs.statKind', abs);
    if (kind === 'directory' || kind === 'file') {
      localeRoots.push(rel);
    }
  }
  let nextConfigPresent = false;
  for (const name of NEXT_CONFIG_NAMES) {
    const p = host.path.join(projectRoot, name);
    if (existsRuntimeFsSync(p, host.fs)) {
      nextConfigPresent = true;
      break;
    }
  }
  return { localeRoots, nextConfigPresent };
}
