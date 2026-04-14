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
  issuesFromQualityEnglishIdentical,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { QualityOptions } from '@/types/command/quality/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';

export function runQuality(ctx: Context, opts: QualityOptions): CliJsonEnvelope<'quality', QualityJsonData> {
  try {
    return runQualityCore(ctx, opts);
  } catch (err) {
    const empty: QualityJsonData = { total: 0, perFile: {}, dynamicKeySites: 0 };
    return buildIoReadFailureEnvelope('quality', empty, ctx, err);
  }
}

function runQualityCore(ctx: Context, opts: QualityOptions): CliJsonEnvelope<'quality', QualityJsonData> {
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

  const data = { total, perFile, dynamicKeySites: dynamicSites.length };
  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    issuesFromQualityEnglishIdentical(total),
  );

  return buildCliJsonEnvelope('quality', data, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
}

type QualityJsonData = { total: number; perFile: Record<string, number>; dynamicKeySites: number };

