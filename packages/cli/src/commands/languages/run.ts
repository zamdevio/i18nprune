import { resolveContext } from '@/shared/context/index.js';
import { filterLanguages } from '@/shared/languages/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative, canPrintPrimary } from '@/utils/logger/policy.js';
import { printLanguagesNumberedList } from '@/commands/languages/numbered.js';
import { printTranslateLanguageTable } from '@/commands/languages/table.js';
import type { LanguagesCommandOptions } from '@/types/commands/languages/index.js';
import { stringifyEnvelope } from '@i18nprune/core';
import { runLanguages } from '@/commands/languages/jsonEnvelope.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { formatListShownOmitted } from '@i18nprune/core';

function resolveLanguagesData(opts: LanguagesCommandOptions): ReturnType<typeof filterLanguages> {
  return filterLanguages(opts.filter);
}

export async function languages(opts: LanguagesCommandOptions): Promise<void> {
  const ctx = await resolveContext();

  if (ctx.run.json) {
    const envelope = runLanguages(ctx, opts);
    console.log(stringifyEnvelope(envelope));
    return;
  }

  const rows = resolveLanguagesData(opts);
  const window = resolveCliListWindow(ctx.config);
  const shownRows = rows.slice(0, window.limit);

  if (canPrintDecorative(ctx.run)) {
    if (opts.filter?.trim()) {
      logger.decorative.dim(
        `  filter: ${opts.filter.trim()} · ${String(rows.length)} match(es)`,
        ctx.run,
      );
    } else {
      logger.decorative.dim(`  ${String(rows.length)} codes · Google Translate–oriented list`, ctx.run);
    }
    logger.decorative.dim('  BCP47-style slugs for `i18nprune generate --target`.', ctx.run);
    if (!opts.table) {
      logger.decorative.dim('  Bordered table: add `--table`.', ctx.run);
    }
    logger.decorative.blank(ctx.run);
  }

  if (canPrintPrimary(ctx.run)) {
    if (opts.table) {
      printTranslateLanguageTable(shownRows);
    } else {
      printLanguagesNumberedList(shownRows);
    }
    const omittedRows = rows.length - shownRows.length;
    if (omittedRows > 0) {
      logger.primary(formatListShownOmitted(`  · ${String(shownRows.length)} language code(s) shown`, omittedRows), ctx.run);
    }
  }
  if (canPrintDecorative(ctx.run)) {
    logger.decorative.blank(ctx.run);
  }
}
