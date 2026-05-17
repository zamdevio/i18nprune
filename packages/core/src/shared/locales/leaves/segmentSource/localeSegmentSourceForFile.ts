import type { LocaleLeafPathApi, LocaleSegmentSource } from '../../../../types/locales/leaves/segmentSource.js';
import { localeCodeForSegment } from '../../enumerate/parseSegmentLocale.js';
import type { LocalesLayoutStructure } from '../../../../types/locales/layout.js';

export function localeSegmentSourceForFile(input: {
  path: LocaleLeafPathApi;
  absoluteFile: string;
  localesDir: string;
  structure: LocalesLayoutStructure;
}): LocaleSegmentSource | null {
  const { path, absoluteFile, localesDir, structure } = input;
  let relativePath = path.relative(localesDir, absoluteFile);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    relativePath = path.basename(absoluteFile);
  }
  relativePath = relativePath.replace(/\\/g, '/');
  const locale = localeCodeForSegment(structure, path, { absolutePath: absoluteFile, relativePath });
  if (locale === null) return null;
  return { file: absoluteFile, locale, relativePath };
}
