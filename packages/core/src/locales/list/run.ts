import { listLocaleSegmentsFromContext } from '../../shared/locales/enumerate/fromContext.js';
import { buildLocaleListRows } from '../summary.js';
import type { LocaleListRow } from '../summary.js';
import type { CoreContext } from '../../types/context/index.js';
import type { LocaleSegmentRef } from '../../types/locales/enumerate.js';
import type { Issue } from '../../types/json/envelope/index.js';

export type ListJsonPayload = {
  kind: 'locales-list';
  sourceLocaleCode: string;
  sourceLocalePath: string;
  localesDir: string;
  localeCount: number;
  targetLocaleCount: number;
  rows: LocaleListRow[];
};

export type ListRunResult = {
  payload: ListJsonPayload;
  issues: Issue[];
};

/**
 * Core entry for the `locales list` operation.
 *
 * Discovers locale JSON files under `localesDir`, builds per-locale row data
 * (leaf counts, source-identical counts), and returns a structured payload.
 * No `process.*` access, no file writes.
 */
function primarySegmentRelativePath(
  segments: readonly LocaleSegmentRef[],
  localeCode: string,
  sourceLocale: string,
  pathApi: CoreContext['adapters']['path'],
): string | undefined {
  const forLocale = segments.filter((s) => s.locale === localeCode);
  if (forLocale.length === 0) return undefined;
  const sourceMatch = forLocale.find(
    (s) => pathApi.resolve(s.absolutePath) === pathApi.resolve(sourceLocale),
  );
  const pick = sourceMatch ?? forLocale.slice().sort((a, b) => a.relativePath.localeCompare(b.relativePath))[0];
  return pick?.relativePath;
}

export function runLocalesList(ctx: CoreContext): ListRunResult {
  const { localesDir, sourceLocale } = ctx.paths;
  const pathApi = ctx.adapters.path;

  const { segments } = listLocaleSegmentsFromContext(ctx);
  const localeCodes = [...new Set(segments.map((s) => s.locale))].sort((a, b) => a.localeCompare(b));
  const files = localeCodes
    .map((code) => primarySegmentRelativePath(segments, code, sourceLocale, pathApi))
    .filter((rel): rel is string => rel !== undefined);

  const rows = buildLocaleListRows(ctx, files);

  const sourceLocaleCode = ctx.adapters.path.basename(sourceLocale, '.json');

  const payload: ListJsonPayload = {
    kind: 'locales-list',
    sourceLocaleCode,
    sourceLocalePath: sourceLocale,
    localesDir,
    localeCount: rows.length,
    targetLocaleCount: rows.filter((row) => !row.isSourceLocale).length,
    rows,
  };

  return { payload, issues: [] };
}
