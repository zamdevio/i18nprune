import type { CoreContext } from '../types/context/index.js';
import { isLocalesLayoutReadSupported, resolveLocalesLayoutFromContext } from '../shared/locales/layout/resolveLayout.js';
import { readLocaleJsonFromContextSync } from '../shared/locales/read/bundle.js';
import { translationSurfacePathValueMap } from '../shared/projects/localeSurfaceMap.js';

export type LocaleListRow = {
  code: string;
  localePath: string;
  leafCount: number;
  englishIdenticalLeafCount: number | null;
  isSourceLocale: boolean;
};

function basenameWithoutJson(fileName: string): string {
  return fileName.endsWith('.json') ? fileName.slice(0, -'.json'.length) : fileName;
}

function toLeafMap(ctx: CoreContext, absoluteFile: string): Map<string, string> {
  if (!isLocalesLayoutReadSupported(resolveLocalesLayoutFromContext(ctx))) {
    return new Map();
  }
  return translationSurfacePathValueMap(readLocaleJsonFromContextSync(ctx, absoluteFile));
}

export function buildLocaleListRows(ctx: CoreContext, localeFiles: string[]): LocaleListRow[] {
  const { localesDir, sourceLocale } = ctx.paths;
  const pathApi = ctx.adapters.path;
  const sourceMap = toLeafMap(ctx, sourceLocale);
  return localeFiles
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => {
      const localePath = pathApi.join(localesDir, fileName);
      const localeMap = toLeafMap(ctx, localePath);
      const isSourceLocale = pathApi.resolve(localePath) === pathApi.resolve(sourceLocale);
      let englishIdenticalLeafCount: number | null = null;
      if (!isSourceLocale) {
        let identical = 0;
        for (const [leafPath, value] of localeMap) {
          if (sourceMap.get(leafPath) === value) identical += 1;
        }
        englishIdenticalLeafCount = identical;
      }
      return {
        code: basenameWithoutJson(fileName),
        localePath,
        leafCount: localeMap.size,
        englishIdenticalLeafCount,
        isSourceLocale,
      };
    });
}
