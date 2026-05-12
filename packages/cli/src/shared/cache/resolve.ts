import { buildValidateIssues, extractor, type DynamicKeySite, type KeyObservation } from '@i18nprune/core';
import { buildCliJsonEnvelope } from '@i18nprune/core';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import { runValidate } from '@/shared/programmatic/runValidate.js';
import { resolveProjectReportData } from './reportData.js';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';
import type { Context } from '@/types/core/context/index.js';
import type { ValidateJsonOutput } from '@/types/command/validate/index.js';

export function resolveCachedProjectReportDocument(ctx: Context) {
  return resolveProjectReportData(ctx).document;
}

export function resolveValidateData(
  ctx: Context,
  runId: string,
): {
  envelope: ReturnType<typeof runValidate>;
  fullDynamicSites: DynamicKeySite[];
  fullKeyObservations: KeyObservation[];
} {
  try {
    const doc = resolveCachedProjectReportDocument(ctx);
    const missing = doc.details.missingKeys;
    const dynamicSites = doc.details.dynamicSites as DynamicKeySite[];
    const keyObservations = doc.details.keyObservations as KeyObservation[];
    const data: ValidateJsonOutput = {
      missing,
      count: keyObservations.length,
      dynamic: { count: dynamicSites.length },
      keyObservations: { count: keyObservations.length },
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
      fullKeyObservations: keyObservations,
    };
  } catch {
    const envelope = runValidate(ctx, { runId });
    const scanInput = toExtractorScanInput(ctx);
    const fullDynamicSites = extractor.dynamic.scanProjectDynamicKeySites(scanInput);
    const fullKeyObservations = extractor.keySites.scanProjectKeyObservations(scanInput);
    return { envelope, fullDynamicSites, fullKeyObservations };
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

export function resolveKeyObservationsCount(ctx: Context): number {
  try {
    const doc = resolveCachedProjectReportDocument(ctx);
    const obs = doc.details.keyObservations;
    return Array.isArray(obs) ? obs.length : 0;
  } catch {
    return extractor.keySites.scanProjectKeyObservations(toExtractorScanInput(ctx)).length;
  }
}

/** Human summaries: align with **`validate`** (`dynamic`, `keyObservations`). */
export function resolveExtractionBaselineCounts(ctx: Context): {
  dynamic: number;
  keyObservations: number;
} {
  return { dynamic: resolveDynamicSitesCount(ctx), keyObservations: resolveKeyObservationsCount(ctx) };
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
