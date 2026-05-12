import { buildCliJsonEnvelope, buildValidateIssues, extractor, type DynamicKeySite, type KeyObservation } from '@i18nprune/core';
import { toExtractorScanInput } from '@/shared/extractor/index.js';
import { resolveCachedProjectReportDocument } from '@/shared/cache/index.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { ValidateJsonOutput } from '@/types/command/validate/index.js';
import { runValidate } from './jsonEnvelope.js';

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
        cwd: ctx.adapters.system.cwd(),
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
