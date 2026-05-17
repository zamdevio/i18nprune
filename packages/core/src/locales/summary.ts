import type { CoreContext } from '../types/context/index.js';
import { isLocalesLayoutReadSupported, resolveLocalesLayoutFromContext } from '../shared/locales/layout/resolveLayout.js';
import { readLocaleJsonFromContextSync } from '../shared/locales/read/bundle.js';
import { primarySegmentForLocale, segmentsForLocaleCode, sourceLocaleCodeFromContext } from '../shared/locales/targets/index.js';
import { translationSurfacePathValueMap } from '../shared/projects/localeSurfaceMap.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';

export type LocaleListRow = {
  code: string;
  localePath: string;
  leafCount: number;
  englishIdenticalLeafCount: number | null;
  isSourceLocale: boolean;
};

function toLeafMap(ctx: CoreContext, absoluteFile: string): Map<string, string> {
  if (!isLocalesLayoutReadSupported(resolveLocalesLayoutFromContext(ctx))) {
    return new Map();
  }
  return translationSurfacePathValueMap(readLocaleJsonFromContextSync(ctx, absoluteFile));
}

export function buildLocaleListRows(ctx: CoreContext, localeCodes: string[]): LocaleListRow[] {
  const { sourceLocale } = ctx.paths;
  const pathApi = ctx.adapters.path;
  const sourceMap = toLeafMap(ctx, sourceLocale);
  const sourceCode = sourceLocaleCodeFromContext(ctx);

  return localeCodes
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .map((code) => {
      const normalized = normalizeLanguageCode(code);
      const segments = segmentsForLocaleCode(ctx, normalized);
      const primary = primarySegmentForLocale(ctx, normalized);
      const localePath = primary?.absolutePath ?? pathApi.join(ctx.paths.localesDir, `${normalized}.json`);
      const isSourceLocale = normalized === sourceCode;

      const leafMaps = segments.map((s) => toLeafMap(ctx, s.absolutePath));
      const leafCount = leafMaps.reduce((sum, m) => sum + m.size, 0);

      let englishIdenticalLeafCount: number | null = null;
      if (!isSourceLocale) {
        let identical = 0;
        for (const localeMap of leafMaps) {
          for (const [leafPath, value] of localeMap) {
            if (sourceMap.get(leafPath) === value) identical += 1;
          }
        }
        englishIdenticalLeafCount = identical;
      }

      return {
        code: normalized,
        localePath,
        leafCount,
        englishIdenticalLeafCount,
        isSourceLocale,
      };
    });
}
