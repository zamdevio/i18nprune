import { localeCodesFromContext, sourceLocaleCodeFromContext } from '../../shared/locales/targets/index.js';
import { buildLocaleListRows } from '../summary.js';
import type { CoreContext } from '../../types/context/index.js';
import type { ListJsonPayload, ListRunResult } from '../../types/locales/index.js';

/**
 * Core entry for the `locales list` operation.
 *
 * Discovers locale JSON files under `localesDir`, builds per-locale row data
 * (leaf counts, source-identical counts), and returns a structured payload.
 * No `process.*` access, no file writes.
 */
export function runLocalesList(ctx: CoreContext): ListRunResult {
  const { localesDir, sourceLocale } = ctx.paths;
  const localeCodes = localeCodesFromContext(ctx);
  const rows = buildLocaleListRows(ctx, localeCodes);
  const sourceLocaleCode = sourceLocaleCodeFromContext(ctx);

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
