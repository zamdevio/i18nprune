import { localeSegmentRefFromAbsolute } from '../enumerate/resolveSegmentPath.js';
import { listLocaleSegments } from '../enumerate/listLocaleSegments.js';
import { resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import { normalizeLanguageCode } from '../../languages/normalize.js';
import { primarySegmentForLocale } from '../targets/context.js';
import type { CoreContext } from '../../../types/context/index.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';
import type {
  LocaleCodeReadSnapshot,
  LocaleSegmentReadSnapshot,
} from '../../../types/locales/readCache.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';
import { ISSUE_IO_READ_FAILED } from '../../constants/issueCodes.js';
import { I18nPruneError } from '../../errors/index.js';
import { dropLocaleCodeReadCache } from './cache.js';
import { readLocaleBundle } from './bundle.js';
import type { ReadFlatLocaleJsonSurfaceResult } from '../../../types/locales/readFlatSurface.js';

function storeSegmentSnapshot(
  ctx: CoreContext,
  absoluteFile: string,
  snapshot: LocaleSegmentReadSnapshot,
): void {
  ctx.localeRead.segments.set(absoluteFile, snapshot);
  if (snapshot.ok) {
    const layout = resolveLocalesLayoutFromContext(ctx);
    const ref = localeSegmentRefFromAbsolute({
      layout,
      path: ctx.adapters.path,
      absolutePath: absoluteFile,
    });
    if (ref !== null) {
      dropLocaleCodeReadCache(ctx, ref.locale);
    }
  }
}

function segmentSnapshotToResult(snapshot: LocaleSegmentReadSnapshot): ReadFlatLocaleJsonSurfaceResult {
  if (snapshot.ok) {
    return {
      ok: true,
      document: snapshot.document,
      leaves: snapshot.leaves,
      text: snapshot.text,
      diagnostics: [],
    };
  }
  return { ok: false, leaves: [], diagnostics: snapshot.diagnostics };
}

/** Read one locale segment file through the shared per-run {@link CoreContext.localeRead} cache. */
export function readLocaleSegmentFromContext(
  ctx: CoreContext,
  absoluteFile: string,
  onDiagnostic?: (d: LocaleReadDiagnostic) => void,
): ReadFlatLocaleJsonSurfaceResult {
  const cached = ctx.localeRead.segments.get(absoluteFile);
  if (cached !== undefined) {
    return segmentSnapshotToResult(cached);
  }

  const result = readLocaleBundle({
    layout: resolveLocalesLayoutFromContext(ctx),
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
    absoluteFile,
    onDiagnostic,
  });

  if (result.ok) {
    storeSegmentSnapshot(ctx, absoluteFile, {
      ok: true,
      absolutePath: absoluteFile,
      document: result.document,
      leaves: result.leaves,
      text: result.text,
    });
  } else {
    storeSegmentSnapshot(ctx, absoluteFile, {
      ok: false,
      absolutePath: absoluteFile,
      diagnostics: result.diagnostics,
    });
  }

  return result;
}

function storeLocaleCodeSnapshot(ctx: CoreContext, snapshot: LocaleCodeReadSnapshot): void {
  ctx.localeRead.localeCodes.set(normalizeLanguageCode(snapshot.localeCode), snapshot);
}

/** Read merged translation-surface leaves for one locale code (flat or multi-segment layout). */
export function readLocaleCodeSurfaceFromContext(
  ctx: CoreContext,
  localeCode: string,
  onDiagnostic?: (d: LocaleReadDiagnostic) => void,
): ReadFlatLocaleJsonSurfaceResult {
  const normalized = normalizeLanguageCode(localeCode);
  const cached = ctx.localeRead.localeCodes.get(normalized);
  if (cached !== undefined) {
    return {
      ok: true,
      document: cached.document,
      leaves: cached.leaves,
      text: '',
      diagnostics: [],
    };
  }

  const layout = resolveLocalesLayoutFromContext(ctx);

  if (layout.mode === 'flat_file') {
    const segment = primarySegmentForLocale(ctx, normalized);
    const absoluteFile = segment?.absolutePath ?? ctx.paths.sourceLocale;
    const read = readLocaleSegmentFromContext(ctx, absoluteFile, onDiagnostic);
    if (!read.ok) return read;
    storeLocaleCodeSnapshot(ctx, {
      localeCode: normalized,
      document: read.document,
      leaves: read.leaves,
    });
    return read;
  }

  const diagnostics: LocaleReadDiagnostic[] = [];
  const { segments, diagnostics: listDiagnostics } = listLocaleSegments({
    layout,
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
  });
  diagnostics.push(...listDiagnostics);
  const forLocale = segments.filter((s) => normalizeLanguageCode(s.locale) === normalized);
  if (forLocale.length === 0) {
    const empty: LocaleCodeReadSnapshot = { localeCode: normalized, document: {}, leaves: [] };
    storeLocaleCodeSnapshot(ctx, empty);
    return { ok: true, document: {}, leaves: [], text: '{}', diagnostics };
  }

  const allLeaves: TranslationSurfaceLeaf[] = [];
  const documents: unknown[] = [];
  let combinedText = '';

  for (const segment of forLocale) {
    const read = readLocaleSegmentFromContext(ctx, segment.absolutePath, onDiagnostic);
    diagnostics.push(...read.diagnostics);
    if (!read.ok) return { ok: false, leaves: [], diagnostics };
    allLeaves.push(...read.leaves);
    documents.push(read.document);
    combinedText = read.text;
  }

  const document = documents.length === 1 ? documents[0] : documents;
  storeLocaleCodeSnapshot(ctx, {
    localeCode: normalized,
    document,
    leaves: allLeaves,
  });

  return {
    ok: true,
    document,
    leaves: allLeaves,
    text: combinedText,
    diagnostics,
  };
}

/** Read one locale segment JSON via {@link readLocaleSegmentFromContext} (throws on I/O failure). */
export function readLocaleJsonFromContextSync(ctx: CoreContext, absoluteFile: string): unknown {
  const read = readLocaleSegmentFromContext(ctx, absoluteFile);
  if (!read.ok) {
    const message = read.diagnostics.map((d) => d.message).join(' · ') || 'failed to read locale JSON';
    throw new I18nPruneError(message, 'IO', { issueCode: ISSUE_IO_READ_FAILED });
  }
  return read.document;
}
