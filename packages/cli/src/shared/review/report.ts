import path from 'node:path';
import { buildReviewJsonData, filterLocaleFilesForReview, parseReviewTargetCodes } from '@i18nprune/core';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { extractor } from '@i18nprune/core';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';
import { listHostJsonBasenames, readHostJsonUnknown } from '@/shared/io/hostJson.js';
import type { Context } from '@/types/core/context/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import type { ReviewJsonData, ReviewJsonOpts } from '@/types/command/review/json.js';

/** Shared human + JSON review aggregation (structured leaves + legacy strings). */
export function computeReviewReport(
  ctx: Context,
  opts: ReviewJsonOpts,
  input?: { dynamicKeySites?: number },
): {
  data: ReviewJsonData;
  issues: Issue[];
} {
  const dynamicSiteCount =
    input?.dynamicKeySites ??
    extractor.dynamic.scanProjectDynamicKeySites(toExtractorScanInput(ctx)).length;
  const sourcePath = ctx.paths.sourceLocale;
  const fs = ctx.adapters.fs;
  const sourceRaw = readHostJsonUnknown(sourcePath, fs);
  const sourceBase = path.basename(sourcePath, '.json');
  const dir = ctx.paths.localesDir;
  const files = listHostJsonBasenames(dir, fs).filter((f) => f !== `${sourceBase}.json`);
  const codes = parseReviewTargetCodes(opts.target);
  const filtered = filterLocaleFilesForReview(ctx.adapters.path, files, codes);

  const targetLocaleJsonByFile: Record<string, unknown> = {};
  for (const file of filtered) {
    const full = path.join(dir, file);
    targetLocaleJsonByFile[file] = readHostJsonUnknown(full, fs);
  }
  const data: ReviewJsonData = buildReviewJsonData({
    sourceLocalePath: sourcePath,
    localesDir: ctx.paths.localesDir,
    dynamicKeySites: dynamicSiteCount,
    parity: ctx.config.policies?.parity,
    sourceLocaleJson: sourceRaw,
    targetLocaleJsonByFile,
  });

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSiteCount),
  );

  return { data, issues };
}
