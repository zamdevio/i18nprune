import { resolveContext } from '@/shared/context/index.js';
import { getDisplaySourceLocaleCode } from '@/shared/locales/index.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope, buildCliJsonEnvelope } from '@i18nprune/core';
import { emptyValidateData, executeValidateCore } from './jsonEnvelope.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { buildValidateHumanView, buildValidateReportView } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import type { ValidateOptions, ValidateJsonOutput } from '@/types/command/validate/index.js';
import type { CliJsonEnvelope } from '@i18nprune/core';
import { ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED } from '@i18nprune/core';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { formatListOmittedSuffix } from '@i18nprune/core';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type { DynamicKeySite, KeyObservation } from '@i18nprune/core';
import { analyzePatchingState } from '@i18nprune/core';
import { resolvePatchingProjectRoot } from '@/shared/patching/scaffoldI18nLayout.js';
import { getCliGlobalOverrides } from '@/shared/context/globals.js';
import { issuesFromPatchingDiagnostics, mergeIssues } from '@/shared/result/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';

function pushValidateReportEntriesFromEnvelope(
  ctx: { config: I18nPruneConfig },
  envelope: CliJsonEnvelope<'validate', ValidateJsonOutput>,
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
    const readinessIssues = cliReadinessIssues(ctx, { mode: 'preset', preset: 'validate' });
    if (readinessIssues) {
      if (ctx.run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope('validate', emptyValidateData(), {
              ok: false,
              issues: readinessIssues,
              cwd: ctx.adapters.system.cwd(),
            }),
          ),
        );
        applyCliCiExitGate(false);
        return;
      }
      printCommandSummary(
        {
          command: 'validate',
          ok: false,
          durationMs: wall.elapsedMs(),
          counts: { missing: 0, dynamic: 0, keyObservations: 0 },
          issues: readinessIssues,
        },
        ctx,
      );
      applyCliCiExitGate(false);
      return;
    }

    const runId = String(Date.now());
    let envelope: CliJsonEnvelope<'validate', ValidateJsonOutput>;
    let fullDynamicSites: DynamicKeySite[] = [];
    let fullKeyObservations: KeyObservation[] = [];

    const resolved = executeValidateCore(ctx, { runId, emit: createCliRunEmitter(ctx.run) });
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
      applyCliCiExitGate(envelope.ok);
      return;
    }

    const listWindow = resolveCliListWindow(ctx.config);
    const humanView = buildValidateHumanView({
      missing: envelope.data.missing,
      dynamicSites: fullDynamicSites,
      missingPreviewLimit: listWindow.limit,
    });
    const readFailed = envelope.issues.some((i) => i.code === ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED);
    if (humanView.dynamicWarning) {
      logger.warn(humanView.dynamicWarning, ctx.run);
    }
    if (readFailed) {
      const m = envelope.issues.find((i) => i.code === ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED)?.message;
      if (m) logger.warn(m, ctx.run);
    } else if (envelope.data.missing.length === 0) {
      logger.info(humanView.missingMessage, ctx.run);
    } else {
      logger.warn(humanView.missingMessage, ctx.run);
      for (const m of humanView.missingPreview) logger.detail(`  ${m}`, ctx.run);
      if (humanView.missingHiddenCount > 0) {
        logger.detail(
          `  · ${String(humanView.missingPreview.length)} missing key(s) shown + ${formatListOmittedSuffix(humanView.missingHiddenCount)}`,
          ctx.run,
        );
      }
    }
    printCommandSummary(
      {
        command: 'validate',
        ok: envelope.ok,
        durationMs: wall.elapsedMs(),
        counts: {
          missing: envelope.data.missing.length,
          dynamic: fullDynamicSites.length,
          keyObservations: fullKeyObservations.length,
        },
        issues: envelope.issues,
      },
      ctx,
    );
    applyCliCiExitGate(envelope.ok);
  } finally {
    wall.dispose();
  }
}
