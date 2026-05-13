import { listRuntimeFsDirSync } from '../../runtime/helpers/sync/fs.js';
import { buildLocaleListRows } from '../summary.js';
import type { LocaleListRow } from '../summary.js';
import type { CoreContext } from '../../types/generate/index.js';
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
export function runLocalesList(ctx: CoreContext): ListRunResult {
  const { localesDir, sourceLocale } = ctx.paths;

  const entries = listRuntimeFsDirSync(localesDir, ctx.adapters.fs);
  const files = entries
    .filter((e) => e.kind === 'file' && e.name.endsWith('.json') && !e.name.endsWith('.meta.json'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const rows = buildLocaleListRows(
    { fs: ctx.adapters.fs, path: ctx.adapters.path },
    localesDir,
    files,
    sourceLocale,
  );

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
