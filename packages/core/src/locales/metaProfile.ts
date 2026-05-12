import {
  generatedLanguageCatalog,
  getLanguageByCodeFromCatalog,
} from '../shared/languages/catalog/index.js';
import { languageOftenRtl } from '../shared/languages/rtlHint.js';
import type { ProjectFilesystemRuntime } from '../types/runtime/capabilities.js';
import { existsRuntimeFsSync, readJsonFromRuntimeFsSync } from '../runtime/helpers/sync/index.js';

export type LocaleMetaProfile = {
  englishName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  source: 'meta' | 'catalog';
  metaPath: string;
};

function asDirection(value: unknown): 'ltr' | 'rtl' | null {
  return value === 'rtl' || value === 'ltr' ? value : null;
}

export function resolveLocaleMetaProfile(
  runtime: ProjectFilesystemRuntime,
  localesDir: string,
  code: string,
): LocaleMetaProfile {
  const { fs, path } = runtime;
  const metaPath = path.join(localesDir, `${code}.meta.json`);
  if (existsRuntimeFsSync(metaPath, fs)) {
    try {
      const raw = readJsonFromRuntimeFsSync(metaPath, fs);
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const obj = raw as Record<string, unknown>;
        const englishName = typeof obj.englishName === 'string' ? obj.englishName : null;
        const nativeName = typeof obj.nativeName === 'string' ? obj.nativeName : null;
        const direction = asDirection(obj.direction);
        if (englishName && nativeName && direction) {
          return { englishName, nativeName, direction, source: 'meta', metaPath };
        }
      }
    } catch {
      // Corrupt sidecars are recoverable: callers such as `locales edit` rewrite from catalog defaults.
    }
  }
  const catalog = getLanguageByCodeFromCatalog(generatedLanguageCatalog, code);
  return {
    englishName: catalog?.english ?? code,
    nativeName: catalog?.native ?? code,
    direction: catalog?.direction ?? (languageOftenRtl(code) ? 'rtl' : 'ltr'),
    source: 'catalog',
    metaPath,
  };
}
