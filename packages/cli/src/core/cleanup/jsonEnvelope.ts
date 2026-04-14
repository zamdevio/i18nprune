import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { collectStringLeaves } from '@/core/json/index.js';
import { scanProjectLiteralKeyUsage } from '@/core/extractor/index.js';
import {
  computeCleanupCandidateKeys,
  resolveCleanupKeysWithStringPresence,
} from '@/core/cleanup/index.js';
import { buildKeyReferenceContext, resolveReferenceConfig } from '@/core/reference/index.js';
import { readJsonFile } from '@/utils/fs/index.js';
import { isRipgrepAvailable } from '@/utils/rg/index.js';
import { buildCliJsonEnvelope } from '@/core/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import {
  issuesFromCleanupRipgrepUnavailable,
  issuesFromCleanupUncertainExcluded,
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { CleanupJsonOutput, CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';

/** Same `cleanup --json` / `--check-only` payload (no writes). */
export function runCleanupCheck(ctx: Context, opts: CleanupOptions): CliJsonEnvelope<'cleanup', CleanupJsonOutput> {
  try {
    return runCleanupCheckCore(ctx, opts);
  } catch (err) {
    const empty: CleanupJsonOutput = {
      wouldRemove: 0,
      keys: [],
      dynamicKeySites: 0,
      uncertainPrefixes: [],
    };
    return buildIoReadFailureEnvelope('cleanup', empty, ctx, err);
  }
}

function runCleanupCheckCore(ctx: Context, opts: CleanupOptions): CliJsonEnvelope<'cleanup', CleanupJsonOutput> {
  const eff = resolveReferenceConfig('cleanup', ctx.config);
  const refCtx = buildKeyReferenceContext(ctx, eff);
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readJsonFile(sourcePath);
  const leaves = collectStringLeaves(sourceRaw);
  const usage = scanProjectLiteralKeyUsage(ctx);
  const filterUncertain =
    eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only';
  const { candidates, excludedUncertain } = computeCleanupCandidateKeys({
    leaves,
    usage,
    preserve: ctx.config.policies?.preserve,
    uncertainPrefixes: refCtx.uncertainPrefixes,
    filterUncertainPrefixes: filterUncertain,
  });

  const rgOk = opts.skipRg ? false : isRipgrepAvailable();
  const safeToRemove = resolveCleanupKeysWithStringPresence({
    candidates,
    leaves,
    srcRoot: ctx.paths.srcRoot,
    eff,
    skipRg: Boolean(opts.skipRg),
    rgOk,
    logDetail: undefined,
  });

  const jsonPayload: CleanupJsonOutput = {
    wouldRemove: safeToRemove.length,
    keys: safeToRemove,
    dynamicKeySites: dynamicSites.length,
    uncertainPrefixes: refCtx.uncertainPrefixes,
  };

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    issuesFromCleanupUncertainExcluded(excludedUncertain),
    !opts.skipRg && !rgOk ? issuesFromCleanupRipgrepUnavailable() : [],
  );

  return buildCliJsonEnvelope('cleanup', jsonPayload, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
}

