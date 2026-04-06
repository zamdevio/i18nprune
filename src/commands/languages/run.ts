import { resolveContext } from '@/core/context/index.js';
import { filterLanguages } from '@/core/languages/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative, canPrintPrimary } from '@/utils/logger/policy.js';
import { printLanguagesNumberedList } from '@/commands/languages/numbered.js';
import { printTranslateLanguageTable } from '@/commands/languages/table.js';
import type { LanguagesCommandOptions } from '@/types/commands/languages/index.js';

export async function runLanguagesCommand(opts: LanguagesCommandOptions): Promise<void> {
  const ctx = resolveContext();
  const rows = filterLanguages(opts.filter);

  if (ctx.run.json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  if (canPrintDecorative(ctx.run)) {
    if (opts.filter?.trim()) {
      logger.decorative.dim(
        `  filter: ${opts.filter.trim()} · ${String(rows.length)} match(es)`,
        ctx.run,
      );
    } else {
      logger.decorative.dim(`  ${String(rows.length)} codes · Google Translate–oriented list`, ctx.run);
    }
    logger.decorative.dim('  BCP47-style slugs for `i18nprune generate --lang`.', ctx.run);
    if (!opts.table) {
      logger.decorative.dim('  Bordered table: add `--table`.', ctx.run);
    }
    logger.decorative.blank(ctx.run);
  }

  if (canPrintPrimary(ctx.run)) {
    if (opts.table) {
      printTranslateLanguageTable(rows);
    } else {
      printLanguagesNumberedList(rows);
    }
  }
  if (canPrintDecorative(ctx.run)) {
    logger.decorative.blank(ctx.run);
  }
}
