import path from 'node:path';
import { resolveContext } from '@/core/context/index.js';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { collectStringLeaves } from '@/core/json/index.js';
import { isParityExcluded } from '@/core/parity/index.js';
import { readJsonFile, listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { runQuality } from '@/core/quality/jsonEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromQualityEnglishIdentical,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import { logger } from '@/utils/logger/index.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { QualityOptions } from '@/types/command/quality/index.js';

export async function quality(opts: QualityOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();

  if (ctx.run.json) {
    const envelope = runQuality(ctx, opts);
    console.log(stringifyEnvelope(envelope));
    if (!envelope.ok) {
      process.exitCode = 1;
    }
    const d = envelope.data;
    pushReportEntry({
      command: 'quality',
      level: 'info',
      message: 'quality completed',
      data: { total: d.total, dynamicKeySites: d.dynamicKeySites, target: opts.target ?? '(all)' },
    });
    finalizeReportFile(ctx.config, {
      command: 'quality',
      ok: envelope.ok,
      durationMs: Date.now() - started,
      counts: { total: d.total, dynamicKeySites: d.dynamicKeySites },
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

  const perFile: Record<string, number> = {};
  let total = 0;
  for (const file of filtered) {
    const full = path.join(dir, file);
    const targetRaw = readJsonFile(full);
    const tLeaves = collectStringLeaves(targetRaw);
    let n = 0;
    for (const leaf of tLeaves) {
      const srcVal = sourceMap.get(leaf.path);
      if (srcVal === undefined) continue;
      if (isParityExcluded(leaf.path, leaf.value, ctx.config.policies?.parity)) continue;
      if (leaf.value === srcVal) n += 1;
    }
    perFile[file] = n;
    total += n;
  }

  logger.info(`English-identical leaves (value equals source): ${String(total)}`);
  for (const [f, c] of Object.entries(perFile)) {
    if (c > 0) logger.detail(`  ${f}: ${String(c)}`);
  }
  if (dynamicSites.length > 0) {
    logger.detail(
      `  non-literal translation call site(s) (separate from parity above): ${String(dynamicSites.length)}`,
      ctx.run,
    );
  }
  pushReportEntry({
    command: 'quality',
    level: 'info',
    message: 'quality completed',
    data: { total, dynamicKeySites: dynamicSites.length, target: opts.target ?? '(all)' },
  });
  finalizeReportFile(ctx.config, {
    command: 'quality',
    durationMs: Date.now() - started,
    counts: { total, dynamicKeySites: dynamicSites.length },
  });
  const summaryIssues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    issuesFromQualityEnglishIdentical(total),
  );
  printCommandSummary(
    {
      command: 'quality',
      ok: true,
      durationMs: Date.now() - started,
      counts: { total, dynamicKeySites: dynamicSites.length },
      issues: summaryIssues,
    },
    ctx,
  );
}
