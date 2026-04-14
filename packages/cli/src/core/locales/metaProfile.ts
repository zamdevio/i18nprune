import path from 'node:path';
import { getLanguageByCode } from '@/core/languages/index.js';
import { fileExists, readJsonFile } from '@/utils/fs/index.js';

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

export function resolveLocaleMetaProfile(localesDir: string, code: string): LocaleMetaProfile {
  const metaPath = path.join(localesDir, `${code}.meta.json`);
  if (fileExists(metaPath)) {
    const raw = readJsonFile(metaPath);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const obj = raw as Record<string, unknown>;
      const englishName = typeof obj.englishName === 'string' ? obj.englishName : null;
      const nativeName = typeof obj.nativeName === 'string' ? obj.nativeName : null;
      const direction = asDirection(obj.direction);
      if (englishName && nativeName && direction) {
        return { englishName, nativeName, direction, source: 'meta', metaPath };
      }
    }
  }
  const catalog = getLanguageByCode(code);
  return {
    englishName: catalog?.english ?? code,
    nativeName: catalog?.native ?? code,
    direction: 'ltr',
    source: 'catalog',
    metaPath,
  };
}
