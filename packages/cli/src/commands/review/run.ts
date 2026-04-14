import path from 'node:path';
import { resolveContext } from '@/core/context/index.js';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { collectStringLeaves } from '@/core/json/index.js';
import { isParityExcluded } from '@/core/parity/index.js';
import { readJsonFile, listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { runReview } from '@/core/review/jsonEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import { logger } from '@/utils/logger/index.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import {
  formatReviewDetailLine,
  formatReviewLocaleHeading,
  formatReviewSectionTitle,
  formatReviewToolLine,
} from '@/core/review/humanLog.js';

/** Locale-level review: leaf counts + English-identical counts. */
export async function review(opts: {
  target?: string;
  /** Parsed **`review --top`** (positive int). Reserved until per-path human lists ship. */
  top?: number;
  /** Parsed **`review --full`**. Reserved alongside **`top`**. */
  full?: boolean;
}): Promise<void> {
  void opts.top;
  void opts.full;
  const started = Date.now();
  const ctx = resolveContext();
  const { run } = ctx;

  if (run.json) {
    const envelope = runReview(ctx, opts);
    console.log(stringifyEnvelope(envelope));
    if (!envelope.ok) {
      process.exitCode = 1;
    }
    const n = Object.keys(envelope.data.locales).length;
    pushReportEntry({
      command: 'review',
      level: 'info',
      message: 'review completed',
      data: { locales: n, dynamicKeySites: envelope.data.dynamicKeySites },
    });
    finalizeReportFile(ctx.config, {
      command: 'review',
      ok: envelope.ok,
      durationMs: Date.now() - started,
      counts: { locales: n, dynamicKeySites: envelope.data.dynamicKeySites },
    });
    return;
  }

  const dynamicSites = scanProjectDynamicKeySites(ctx);
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readJsonFile(sourcePath);
  const sourceLeaves = collectStringLeaves(sourceRaw);
  const sourceMap = new Map(sourceLeaves.map((l) => [l.path, l.value]));
  const sourceBase = path.basename(sourcePath, '.json');
  const dir = ctx.paths.localesDir;
  const files = listJsonBasenamesInDir(dir).filter((f) => f !== `${sourceBase}.json`);
  const filtered = opts.target
    ? files.filter((f) => path.basename(f, '.json') === opts.target)
    : files;

  const locales: Record<string, { stringPaths: number; englishIdentical: number }> = {};

  for (const file of filtered) {
    const full = path.join(dir, file);
    const targetRaw = readJsonFile(full);
    const tLeaves = collectStringLeaves(targetRaw);
    let englishIdentical = 0;
    for (const leaf of tLeaves) {
      const srcVal = sourceMap.get(leaf.path);
      if (srcVal === undefined) continue;
      if (isParityExcluded(leaf.path, leaf.value, ctx.config.policies?.parity)) continue;
      if (leaf.value === srcVal) englishIdentical += 1;
    }
    locales[file] = {
      stringPaths: tLeaves.length,
      englishIdentical,
    };
  }

  logger.primary(formatReviewSectionTitle('Review'), run);
  logger.primary(
    formatReviewToolLine(
      'info',
      `Locale files: ${String(Object.keys(locales).length)} (vs source ${sourceBase})`,
    ),
    run,
  );
  if (dynamicSites.length > 0) {
    logger.primary(
      formatReviewToolLine(
        'warn',
        `Non-literal translation call site(s): ${String(dynamicSites.length)} (see validate / locales dynamic)`,
      ),
      run,
    );
  }
  for (const [f, v] of Object.entries(locales)) {
    logger.decorative.blank(run);
    logger.primary(formatReviewLocaleHeading(f), run);
    logger.primary(
      formatReviewToolLine(
        'info',
        `String paths: ${String(v.stringPaths)} · English-identical: ${String(v.englishIdentical)}`,
      ),
      run,
    );
  }
  const anyIdentical = Object.values(locales).some((v) => v.englishIdentical > 0);
  if (anyIdentical) {
    logger.decorative.blank(run);
    logger.primary(
      formatReviewDetailLine(
        'Tip: English-identical leaves match the source string at the same path — use fill or generate to refresh translations.',
      ),
      run,
    );
  }
  pushReportEntry({
    command: 'review',
    level: 'info',
    message: 'review completed',
    data: { locales: Object.keys(locales).length, dynamicKeySites: dynamicSites.length },
  });
  finalizeReportFile(ctx.config, {
    command: 'review',
    durationMs: Date.now() - started,
    counts: { locales: Object.keys(locales).length, dynamicKeySites: dynamicSites.length },
  });

  printCommandSummary(
    {
      command: 'review',
      ok: true,
      durationMs: Date.now() - started,
      counts: { dynamicKeySites: dynamicSites.length },
      issues: mergeIssues(
        issuesFromDiscoveryWarnings(ctx.meta.warnings),
        issuesFromDynamicScanCount(dynamicSites.length),
      ),
    },
    ctx,
  );
}
