import { resolveContext } from '@/core/context/index.js';
import { filterLanguages } from '@/core/languages/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative, canPrintPrimary } from '@/utils/logger/policy.js';
import { printLanguagesNumberedList } from '@/commands/languages/numbered.js';
import { printTranslateLanguageTable } from '@/commands/languages/table.js';
import type { LanguagesCommandOptions } from '@/types/commands/languages/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { runLanguages } from '@/core/languages/jsonEnvelope.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';

export async function languages(opts: LanguagesCommandOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();

  if (ctx.run.json) {
    const envelope = runLanguages(ctx, opts);
    console.log(stringifyEnvelope(envelope));
    const count = Array.isArray(envelope.data) ? envelope.data.length : 0;
    pushReportEntry({
      command: 'languages',
      level: 'info',
      message: 'languages list emitted',
      data: { count, table: Boolean(opts.table), filter: opts.filter ?? '' },
    });
    finalizeReportFile(ctx.config, {
      command: 'languages',
      durationMs: Date.now() - started,
      counts: { rows: count },
    });
    return;
  }

  const rows = filterLanguages(opts.filter);

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
      printTranslateLanguageTable(rows);
    } else {
      printLanguagesNumberedList(rows);
    }
  }
  if (canPrintDecorative(ctx.run)) {
    logger.decorative.blank(ctx.run);
  }
  pushReportEntry({
    command: 'languages',
    level: 'info',
    message: 'languages completed',
    data: { count: rows.length, table: Boolean(opts.table), filter: opts.filter ?? '' },
  });
  finalizeReportFile(ctx.config, {
    command: 'languages',
    durationMs: Date.now() - started,
    counts: { rows: rows.length },
  });
}
