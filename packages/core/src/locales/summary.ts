import type { CoreContext } from '../types/context/index.js';
import { isLocalesLayoutReadSupported, resolveLocalesLayoutFromContext } from '../shared/locales/layout/resolveLayout.js';
import { readLocaleSegmentFromContext } from '../shared/locales/read/index.js';
import { primarySegmentForLocale, segmentsForLocaleCode, sourceLocaleCodeFromContext } from '../shared/locales/targets/index.js';
import { translationSurfacePathValueMapFromLeaves } from '../shared/projects/localeSurfaceMap.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { toPosixPath } from '../shared/path/posix.js';

export type LocaleListRow = {
  code: string;
  localePath: string;
  /** On-disk JSON segments for this locale code (e.g. `app/en.json`, `common/en.json`). */
  segmentCount: number;
  segmentRelativePaths: string[];
  leafCount: number;
  englishIdenticalLeafCount: number | null;
  isSourceLocale: boolean;
};

function toLeafMap(ctx: CoreContext, absoluteFile: string): Map<string, string> {
  if (!isLocalesLayoutReadSupported(resolveLocalesLayoutFromContext(ctx))) {
    return new Map();
  }
  const read = readLocaleSegmentFromContext(ctx, absoluteFile);
  if (!read.ok) return new Map();
  return translationSurfacePathValueMapFromLeaves(read.leaves);
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
      const localePath = toPosixPath(
        primary?.absolutePath ?? pathApi.join(ctx.paths.localesDir, `${normalized}.json`),
      );
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

      const segmentRelativePaths = segments.map((s) => s.relativePath).sort((a, b) => a.localeCompare(b));

      return {
        code: normalized,
        localePath,
        segmentCount: segments.length,
        segmentRelativePaths,
        leafCount,
        englishIdenticalLeafCount,
        isSourceLocale,
      };
    });
}
