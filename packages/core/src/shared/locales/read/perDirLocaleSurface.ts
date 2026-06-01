import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';
import { listLocaleSegments } from '../enumerate/listLocaleSegments.js';
import { readFlatLocaleJsonSurface } from './flatFileSurface.js';
import type { ReadFlatLocaleJsonSurfaceResult } from '../../../types/locales/readFlatSurface.js';

/**
 * Read and merge all JSON segments for one locale code (`locale_per_dir` or `feature_bundle`).
 */
export function readLocalePerDirLocaleSurface(input: {
  layout: ResolvedLocalesLayout;
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
  localeCode: string;
  onDiagnostic?: (d: LocaleReadDiagnostic) => void;
}): ReadFlatLocaleJsonSurfaceResult {
  const diagnostics: LocaleReadDiagnostic[] = [];
  const emit = (d: LocaleReadDiagnostic) => {
    diagnostics.push(d);
    input.onDiagnostic?.(d);
  };

  const { segments, diagnostics: listDiagnostics } = listLocaleSegments({
    layout: input.layout,
    fs: input.fs,
    path: input.path,
  });
  diagnostics.push(...listDiagnostics);
  const forLocale = segments.filter((s) => s.locale === input.localeCode);
  if (forLocale.length === 0) {
    emit({
      level: 'warn',
      code: 'locale_segment_not_found',
      message: `no locale segments found for code ${input.localeCode}`,
    });
    return { ok: true, document: {}, leaves: [], text: '{}', diagnostics };
  }

  const allLeaves: TranslationSurfaceLeaf[] = [];
  const documents: unknown[] = [];
  let combinedText = '';

  for (const segment of forLocale) {
    const read = readFlatLocaleJsonSurface({
      fs: input.fs,
      path: input.path,
      absoluteFile: segment.absolutePath,
      localesDir: input.layout.directoryAbsolute,
      structure: input.layout.structure,
      onDiagnostic: input.onDiagnostic,
    });
    diagnostics.push(...read.diagnostics);
    if (!read.ok) return { ok: false, leaves: [], diagnostics };
    allLeaves.push(...read.leaves);
    documents.push(read.document);
    combinedText = read.text;
  }

  return {
    ok: true,
    document: documents.length === 1 ? documents[0] : documents,
    leaves: allLeaves,
    text: combinedText,
    diagnostics,
  };
}
