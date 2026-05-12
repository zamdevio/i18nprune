import { resolveContext } from '@/shared/context/index.js';
import { getDisplaySourceLocaleCode } from '@/shared/locales/index.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@i18nprune/core';
import { runValidate } from './jsonEnvelope.js';
import { buildValidateReportView } from '@i18nprune/core';
import { buildValidateHumanView } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import type { ValidateOptions } from '@/types/command/validate/index.js';
import { ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED } from '@/constants/issueCodes.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type { DynamicKeySite, KeyObservation } from '@i18nprune/core';
import { analyzePatchingState } from '@i18nprune/core';
import { resolvePatchingProjectRoot } from '@/shared/patching/scaffoldI18nLayout.js';
import { getCliGlobalOverrides } from '@/shared/context/globals.js';
import { issuesFromPatchingDiagnostics, mergeIssues } from '@/shared/result/index.js';
import { resolveExtractionBaselineCounts } from '@/shared/cache/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { resolveValidateData } from './cacheData.js';

function pushValidateReportEntriesFromEnvelope(
  ctx: { config: I18nPruneConfig },
  envelope: ReturnType<typeof runValidate>,
  fullDynamicSites: DynamicKeySite[],
  fullKeyObservations: KeyObservation[],
): void {
  const { missing, dynamic } = envelope.data;
  const window = resolveCliListWindow(ctx.config);
  const readFailed = envelope.issues.some((i) => i.code === ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED);

  if (readFailed) {
    envelope.issues.find((i) => i.code === ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED);
    return;
  }

  const view = buildValidateReportView({
    missing,
    dynamicSites: fullDynamicSites,
    keyObservations: fullKeyObservations,
    listLimit: window.limit,
  });

  if (missing.length > 0) {
  } else {
  }
  if (dynamic.count > 0 && view.dynamicMessage) {
  }
}

export async function validate(_opts: ValidateOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const runId = String(Date.now());
    let envelope: ReturnType<typeof runValidate>;
    let fullDynamicSites: DynamicKeySite[] = [];
    let fullKeyObservations: KeyObservation[] = [];

    const resolved = resolveValidateData(ctx, runId);
    envelope = resolved.envelope;
    fullDynamicSites = resolved.fullDynamicSites;
    fullKeyObservations = resolved.fullKeyObservations;
    const patchingProjectRoot = resolvePatchingProjectRoot(ctx);
    const patchingAnalysis = await analyzePatchingState({
      command: 'sync',
      action: 'upsert_locales',
      changedLocaleCodes: [],
      sourceLocaleCode: getDisplaySourceLocaleCode(ctx),
      config: ctx.config.patching,
      runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
      treatAsPatchRequested: getCliGlobalOverrides().patch === true,
      projectRoot: patchingProjectRoot,
    });
    envelope = {
      ...envelope,
      issues: mergeIssues(envelope.issues, issuesFromPatchingDiagnostics(patchingAnalysis.diagnostics)),
    };

    pushValidateReportEntriesFromEnvelope(ctx, envelope, fullDynamicSites, fullKeyObservations);
    if (ctx.run.json) {
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
      }
      return;
    }

    const humanView = buildValidateHumanView({ missing: envelope.data.missing, dynamicSites: fullDynamicSites });
    if (humanView.dynamicWarning) {
      logger.warn(humanView.dynamicWarning, ctx.run);
    }
    if (envelope.data.missing.length === 0) {
      logger.info(humanView.missingMessage, ctx.run);
    } else {
      logger.warn(humanView.missingMessage, ctx.run);
      for (const m of humanView.missingPreview) logger.detail(`  ${m}`, ctx.run);
      if (humanView.missingHiddenCount > 0) logger.detail(`  … and ${String(humanView.missingHiddenCount)} more`, ctx.run);
    }
    printCommandSummary(
      {
        command: 'validate',
        ok: envelope.ok,
        durationMs: wall.elapsedMs(),
        counts: {
          missing: envelope.data.missing.length,
          ...resolveExtractionBaselineCounts(ctx),
        },
        issues: envelope.issues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
