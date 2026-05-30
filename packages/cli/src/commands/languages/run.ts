import { DEFAULT_LIST_TOP, formatListShownOmitted, getRunOptions, resolveCoreConfigLayers } from '@i18nprune/core';
import { filterLanguages } from '@/shared/languages/index.js';
import { getCliListFullFlag, getCliListTopFlag } from '@/shared/context/globals.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative, canPrintPrimary } from '@/utils/logger/policy.js';
import { printLanguagesNumberedList } from '@/commands/languages/numbered.js';
import { printTranslateLanguageTable } from '@/commands/languages/table.js';
import type { LanguagesCommandOptions } from '@/types/commands/languages/index.js';
import { stringifyEnvelope } from '@i18nprune/core';
import { runLanguages } from '@/commands/languages/jsonEnvelope.js';

function resolveLanguagesListWindow() {
  return resolveCoreConfigLayers([
    { name: 'defaults', input: { output: { list: { top: DEFAULT_LIST_TOP } } } },
    {
      name: 'cli',
      input: {
        output: {
          list: {
            ...(getCliListTopFlag() !== undefined ? { top: getCliListTopFlag() } : {}),
            ...(getCliListFullFlag() ? { full: true } : {}),
          },
        },
      },
    },
  ]).output.list;
}

function resolveLanguagesData(opts: LanguagesCommandOptions): ReturnType<typeof filterLanguages> {
  return filterLanguages(opts.filter);
}

/** Catalog listing — does not load project config or run readiness. */
export async function languages(opts: LanguagesCommandOptions): Promise<void> {
  const run = getRunOptions();

  if (run.json) {
    const envelope = runLanguages(opts);
    console.log(stringifyEnvelope(envelope));
    return;
  }

  const rows = resolveLanguagesData(opts);
  const window = resolveLanguagesListWindow();
  const shownRows = rows.slice(0, window.limit);

  if (canPrintDecorative(run)) {
    if (opts.filter?.trim()) {
      logger.decorative.dim(
        `  filter: ${opts.filter.trim()} · ${String(rows.length)} match(es)`,
        run,
      );
    } else {
      logger.decorative.dim(`  ${String(rows.length)} codes · Google Translate–oriented list`, run);
    }
    logger.decorative.dim('  BCP47-style slugs for `locales.source` and `i18nprune generate --target`.', run);
    if (!opts.table) {
      logger.decorative.dim('  Bordered table: add `--table`.', run);
    }
    logger.decorative.blank(run);
  }

  if (canPrintPrimary(run)) {
    if (opts.table) {
      printTranslateLanguageTable(shownRows);
    } else {
      printLanguagesNumberedList(shownRows);
    }
    const omittedRows = rows.length - shownRows.length;
    if (omittedRows > 0) {
      logger.primary(formatListShownOmitted(`  · ${String(shownRows.length)} language code(s) shown`, omittedRows), run);
    }
  }
  if (canPrintDecorative(run)) {
    logger.decorative.blank(run);
  }
}
