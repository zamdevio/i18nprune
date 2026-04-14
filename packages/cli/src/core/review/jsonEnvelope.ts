import path from 'node:path';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { collectStringLeaves } from '@/core/json/index.js';
import { isParityExcluded } from '@/core/parity/index.js';
import { readJsonFile, listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { buildCliJsonEnvelope } from '@/core/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import type { ReviewJsonData, ReviewJsonOpts } from '@/types/command/review/json.js';

export type { ReviewJsonOpts } from '@/types/command/review/json.js';

export function runReview(ctx: Context, opts: ReviewJsonOpts): CliJsonEnvelope<'review', ReviewJsonData> {
  try {
    return runReviewCore(ctx, opts);
  } catch (err) {
    const empty: ReviewJsonData = {
      kind: 'localeReview',
      sourceLocale: '',
      localesDir: ctx.paths.localesDir,
      dynamicKeySites: 0,
      locales: {},
    };
    return buildIoReadFailureEnvelope('review', empty, ctx, err);
  }
}

function runReviewCore(ctx: Context, opts: ReviewJsonOpts): CliJsonEnvelope<'review', ReviewJsonData> {
  void opts.top;
  void opts.full;
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

  const report: ReviewJsonData = {
    kind: 'localeReview',
    sourceLocale: sourceBase,
    localesDir: ctx.paths.localesDir,
    dynamicKeySites: dynamicSites.length,
    locales,
  };

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
  );

  return buildCliJsonEnvelope('review', report, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
}

