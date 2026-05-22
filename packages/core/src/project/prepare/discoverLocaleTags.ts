import type { LocalesLayoutMode } from '../../types/locales/layout.js';
import { basenameNoExt } from '../normalizeConfig.js';

/**
 * Discover locale codes from zip text paths (layout-aware). Used when `localeJsonByTag` is empty
 * but locale JSON files are present under `localesDir`.
 */
export function discoverLocaleTagsFromTextFiles(input: {
  textFiles: Record<string, string>;
  localesDir: string;
  sourceLocalePath: string;
  localesMode?: LocalesLayoutMode;
}): string[] {
  const codes = new Set<string>();
  const dir = input.localesDir.replace(/\\/g, '/').replace(/\/$/, '');
  const prefix = `${dir}/`;

  for (const path of Object.keys(input.textFiles)) {
    const norm = path.replace(/\\/g, '/');
    if (!norm.startsWith(prefix) || !norm.endsWith('.json')) continue;
    const rel = norm.slice(prefix.length);
    if (!rel) continue;

    if (input.localesMode === 'locale_directory') {
      const segment = rel.split('/')[0];
      if (!segment) continue;
      const code = segment.endsWith('.json') ? basenameNoExt(segment) : segment;
      if (code.length > 0) codes.add(code);
    } else {
      const base = rel.includes('/') ? (rel.split('/').pop() ?? rel) : rel;
      const code = basenameNoExt(base);
      if (code.length > 0) codes.add(code);
    }
  }

  if (codes.size === 0) {
    const fromSource = basenameNoExt(input.sourceLocalePath.replace(/\\/g, '/'));
    if (fromSource.length > 0) codes.add(fromSource);
  }

  return [...codes].sort((a, b) => a.localeCompare(b));
}
