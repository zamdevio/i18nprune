import fs from 'node:fs';
import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { resolveContext } from '@/core/context/index.js';
import { getCliYesFlag } from '@/core/context/globals.js';
import {
  logMissingPathsPreview,
  resolveMissingHumanDefaultTop,
  resolvePathsToAddForMissing,
} from '@/core/missing/index.js';
import { setAtPath } from '@/core/json/index.js';
import { normalizeLanguageCode } from '@/core/languages/index.js';
import { isSourceLocaleSlug } from '@/core/locales/source.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { readJsonFile, writeJsonFile, fileExists } from '@/utils/fs/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { runMissing } from '@/core/missing/jsonEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromMissingSkippedNotInScan,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import { canAsk } from '@/core/ask/index.js';
import type { I18nPruneConfig } from '@/types/config/index.js';
import type { MissingOptions } from '@/types/command/missing/index.js';
import type { MissingPathDisplayOpts } from '@/types/command/missing/summary.js';

export async function missing(opts: MissingOptions): Promise<void> {
  assertMissingTop(opts);
  const started = Date.now();
  const ctx = resolveContext();
  const { paths, run } = ctx;

  if (run.json) {
    const envelope = runMissing(ctx, opts);
    console.log(stringifyEnvelope(envelope));
    if (!envelope.ok) {
      process.exitCode = 1;
    }
    const d = envelope.data;
    pushReportEntry({
      level: 'info',
      command: 'missing',
      message: opts.dryRun ? 'missing dry-run' : 'missing completed',
      data: { targetPath: d.targetPath, added: d.pathsAdded, dryRun: Boolean(opts.dryRun) },
    });
    finalizeReportFile(ctx.config, {
      command: 'missing',
      ok: envelope.ok,
      durationMs: Date.now() - started,
      counts: { added: d.pathsAdded },
    });
    return;
  }

  const display = missingDisplayOpts(opts, ctx.config);

  const localesDir = paths.localesDir;
  const sourcePath = paths.sourceLocale;

  let targetPath: string;
  let targetLabel: 'source' | 'locale';

  if (opts.locale?.trim()) {
    const code = normalizeLanguageCode(opts.locale.trim());
    if (!fs.existsSync(localesDir)) {
      throw new I18nPruneError(`locales directory not found: ${localesDir}`, 'USAGE');
    }
    targetPath = path.join(localesDir, `${code}.json`);
    targetLabel = 'locale';
    if (!isSourceLocaleSlug(code, sourcePath) && canPrintWarn(run)) {
      logger.warn(
        `missing: writing ${path.basename(targetPath)} — validate still compares code to the source locale file until it matches.`,
        run,
      );
    }
  } else {
    if (!fileExists(sourcePath)) {
      throw new I18nPruneError(`Source locale file not found: ${sourcePath}`, 'USAGE');
    }
    targetPath = sourcePath;
    targetLabel = 'source';
  }

  let localeJson: unknown;
  if (!fileExists(targetPath)) {
    if (targetLabel === 'source') {
      throw new I18nPruneError(`Source locale file not found: ${targetPath}`, 'USAGE');
    }
    localeJson = {};
  } else {
    localeJson = readJsonFile(targetPath);
  }

  const { toAdd, skippedNotInScan } = resolvePathsToAddForMissing(ctx, localeJson, {
    fromReport: opts.fromReport,
  });
  const summaryIssues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromMissingSkippedNotInScan(skippedNotInScan),
  );

  if (skippedNotInScan.length > 0 && canPrintInfo(run)) {
    logger.detail(
      `${String(skippedNotInScan.length)} path(s) from report not in current code scan (ignored).`,
      run,
    );
  }

  if (toAdd.length === 0) {
    if (canPrintInfo(run)) {
      logger.info('missing: nothing to add (all scanned keys already present in target JSON).', run);
    }
    printCommandSummary(
      {
        command: 'missing',
        ok: true,
        durationMs: Date.now() - started,
        counts: { added: 0 },
        issues: summaryIssues,
      },
      ctx,
    );
    finalizeReportFile(ctx.config, {
      command: 'missing',
      ok: true,
      durationMs: Date.now() - started,
      counts: { added: 0 },
    });
    return;
  }

  if (opts.dryRun) {
    if (canPrintInfo(run)) {
      logger.info(`missing: would add ${String(toAdd.length)} path(s) to ${targetPath}:`, run);
    }
    logMissingPathsPreview(toAdd, display, run);
    printCommandSummary(
      {
        command: 'missing',
        ok: true,
        durationMs: Date.now() - started,
        counts: { wouldAdd: toAdd.length },
        issues: summaryIssues,
      },
      ctx,
    );
    pushReportEntry({
      level: 'info',
      command: 'missing',
      message: 'missing dry-run',
      data: { targetPath, wouldAdd: toAdd.length },
    });
    finalizeReportFile(ctx.config, {
      command: 'missing',
      ok: true,
      durationMs: Date.now() - started,
      counts: { wouldAdd: toAdd.length },
    });
    return;
  }

  if (canPrintInfo(run)) {
    logger.info(`missing: will add ${String(toAdd.length)} path(s) to ${targetPath}:`, run);
  }
  logMissingPathsPreview(toAdd, display, run);

  if (canAsk(run) && !getCliYesFlag()) {
    const ok = await confirm({
      message: `Add ${String(toAdd.length)} key path(s) with empty string values to ${targetPath}?`,
      default: false,
    });
    if (!ok) {
      if (canPrintInfo(run)) logger.info('missing: aborted (no files changed).', run);
      printCommandSummary(
        {
          command: 'missing',
          ok: true,
          durationMs: Date.now() - started,
          notes: ['aborted: user declined confirmation'],
          issues: summaryIssues,
        },
        ctx,
      );
      return;
    }
  } else if (!canAsk(run) && !getCliYesFlag()) {
    throw new I18nPruneError(
      'missing: non-interactive run requires global --yes to write files (or use --dry-run)',
      'USAGE',
    );
  }

  let next: unknown = localeJson;
  for (const p of toAdd) {
    next = setAtPath(next, p, '');
  }
  writeJsonFile(targetPath, next);

  if (canPrintInfo(run)) {
    logger.info(`missing: added ${String(toAdd.length)} path(s) to ${targetPath}`, run);
  }
  logMissingPathsPreview(toAdd, display, run);

  const durationMs = Date.now() - started;
  printCommandSummary(
    { command: 'missing', ok: true, durationMs, counts: { added: toAdd.length }, issues: summaryIssues },
    ctx,
  );
  pushReportEntry({
    level: 'info',
    command: 'missing',
    message: 'missing completed',
    data: { targetPath, added: toAdd.length },
  });
  finalizeReportFile(ctx.config, {
    command: 'missing',
    ok: true,
    durationMs,
    counts: { added: toAdd.length },
  });
}

function assertMissingTop(opts: MissingOptions): void {
  if (opts.top === undefined) return;
  if (typeof opts.top !== 'number' || !Number.isInteger(opts.top) || opts.top < 1) {
    throw new I18nPruneError('missing: top must be a positive integer', 'USAGE');
  }
}

function missingDisplayOpts(opts: MissingOptions, config: I18nPruneConfig): MissingPathDisplayOpts {
  const fullList = Boolean(opts.fullList);
  if (fullList) return { fullList: true };
  return { fullList: false, top: opts.top ?? resolveMissingHumanDefaultTop(config) };
}
