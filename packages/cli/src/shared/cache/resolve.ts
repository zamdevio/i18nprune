import { buildValidateIssues, extractor, type DynamicKeySite, type KeyObservation } from '@i18nprune/core';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import { runValidate } from '@/shared/programmatic/runValidate.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { measureQualityEnglishIdentical } from '@/shared/quality/measure.js';
import { computeReviewReport } from '@/shared/review/report.js';
import { resolveProjectReportData } from './reportData.js';
import type { Context } from '@/types/core/context/index.js';
import type { ValidateJsonOutput } from '@/types/command/validate/index.js';
import type { QualityOptions } from '@/types/command/quality/index.js';
import type { ReviewJsonOpts } from '@/types/command/review/json.js';

export function resolveCachedProjectReportDocument(ctx: Context) {
  return resolveProjectReportData(ctx).document;
}

export function resolveValidateData(
  ctx: Context,
  runId: string,
): { envelope: ReturnType<typeof runValidate>; fullDynamicSites: DynamicKeySite[] } {
  const window = resolveCliListWindow(ctx.config);
  try {
    const doc = resolveCachedProjectReportDocument(ctx);
    const missing = doc.details.missingKeys;
    const dynamicSites = doc.details.dynamicSites as DynamicKeySite[];
    const keyObservations = doc.details.keyObservations as KeyObservation[];
    const data: ValidateJsonOutput = {
      missing,
      count: keyObservations.length,
      dynamic: { count: dynamicSites.length, sites: dynamicSites.slice(0, window.limit) },
      keyObservations: { count: keyObservations.length, observations: keyObservations.slice(0, window.limit) },
    };
    return {
      envelope: buildCliJsonEnvelope('validate', data, {
        ok: missing.length === 0,
        issues: mergeIssues(
          issuesFromDiscoveryWarnings(ctx.meta.warnings),
          buildValidateIssues({
            missingCount: data.missing.length,
            dynamicSiteCount: data.dynamic.count,
            sourceLocalePath: ctx.paths.sourceLocale,
          }),
        ),
        cwd: process.cwd(),
      }),
      fullDynamicSites: dynamicSites,
    };
  } catch {
    const envelope = runValidate(ctx, { runId });
    return { envelope, fullDynamicSites: envelope.data.dynamic.sites };
  }
}

export function resolveLocalesDynamicSites(ctx: Context): ReturnType<typeof extractor.dynamic.scanProjectDynamicKeySites> {
  try {
    const doc = resolveCachedProjectReportDocument(ctx);
    return doc.details.dynamicSites as ReturnType<typeof extractor.dynamic.scanProjectDynamicKeySites>;
  } catch {
    return extractor.dynamic.scanProjectDynamicKeySites({
      srcRoot: ctx.paths.srcRoot,
      functions: ctx.config.functions,
      runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path, system: ctx.adapters.system },
      exclude: ctx.config.exclude,
    });
  }
}

export function resolveDynamicSitesCount(ctx: Context): number {
  return resolveLocalesDynamicSites(ctx).length;
}

export function resolveQualityData(ctx: Context, opts: QualityOptions) {
  try {
    const doc = resolveCachedProjectReportDocument(ctx);
    return measureQualityEnglishIdentical(ctx, opts, { dynamicSitesCount: doc.details.dynamicSites.length });
  } catch {
    return measureQualityEnglishIdentical(ctx, opts);
  }
}

export function resolveReviewData(ctx: Context, opts: ReviewJsonOpts) {
  try {
    const doc = resolveCachedProjectReportDocument(ctx);
    return computeReviewReport(ctx, opts, { dynamicKeySites: doc.details.dynamicSites.length });
  } catch {
    return computeReviewReport(ctx, opts);
  }
}

export function resolveMissingResolvedKeys(ctx: Context): ReadonlySet<string> | undefined {
  try {
    const doc = resolveCachedProjectReportDocument(ctx);
    const observations = doc.details.keyObservations as KeyObservation[];
    return extractor.keySites.resolvedKeysFromObservations(observations);
  } catch {
    return undefined;
  }
}
