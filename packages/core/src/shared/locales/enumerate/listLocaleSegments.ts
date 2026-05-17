import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import type { ListLocaleSegmentsResult, LocaleSegmentRef } from '../../../types/locales/enumerate.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import { collectLocaleStructuralParityDiagnostics } from '../diagnostics/structuralParity.js';
import { localeCodeForSegment } from './parseSegmentLocale.js';
import { walkLocaleJsonSegments } from './walkJsonTree.js';

/**
 * Discover locale JSON segment files for a resolved layout (read/write may still be unsupported).
 */
export function listLocaleSegments(input: {
  layout: ResolvedLocalesLayout;
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
}): ListLocaleSegmentsResult {
  const diagnostics: LocaleReadDiagnostic[] = [];
  const { layout, fs, path } = input;
  const recursive = layout.structure !== 'locale_file';
  const walked = walkLocaleJsonSegments({
    fs,
    path,
    rootAbsolute: layout.directoryAbsolute,
    recursive,
  });

  const segments: LocaleSegmentRef[] = [];
  for (const segment of walked) {
    const locale = localeCodeForSegment(layout.structure, path, segment);
    if (locale === null) continue;
    segments.push({
      locale,
      relativePath: segment.relativePath,
      absolutePath: segment.absolutePath,
    });
  }

  segments.sort((a, b) => {
    const byLocale = a.locale.localeCompare(b.locale);
    if (byLocale !== 0) return byLocale;
    return a.relativePath.localeCompare(b.relativePath);
  });

  diagnostics.push(
    ...collectLocaleStructuralParityDiagnostics({
      structure: layout.structure,
      segments,
    }),
  );

  return { segments, diagnostics };
}
