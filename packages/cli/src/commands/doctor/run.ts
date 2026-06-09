import { resolveContext } from '@/shared/context/index.js';
import { getCliGlobalOverrides } from '@/shared/context/globals.js';
import { getDisplaySourceLocaleCode } from '@/shared/locales/index.js';
import { collectDoctorFindings, runDoctor } from '@/commands/doctor/jsonEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDoctorFindings,
  issuesFromDynamicScanCount,
  issuesFromPatchingDiagnostics,
  mergeIssues,
} from '@/shared/result/index.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/index.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@i18nprune/core';
import {
  analyzePatchingState,
  collectTranslationSurfaceLeaves,
  doctorExitCode,
  getRunOptions,
  noopRunEmitter,
} from '@i18nprune/core';
import { resolvePatchingProjectRoot } from '@/shared/patching/scaffoldI18nLayout.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintWarn } from '@/utils/logger/policy.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { readHostJsonUnknown } from '@/shared/io/hostJson.js';
import { resolveProjectAnalysis } from '@i18nprune/core';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import type { DoctorFinding, DoctorJsonPayload } from '@i18nprune/core';
import type { DoctorOptions } from '@/types/commands/doctor/index.js';

function resolveDoctorData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
  opts: DoctorOptions,
  runId: string,
): { jsonEnvelope?: ReturnType<typeof runDoctor>; findings?: DoctorFinding[] } {
  if (ctx.run.json) {
    return { jsonEnvelope: runDoctor(ctx, opts, { emit: noopRunEmitter, runId }) };
  }
  return { findings: collectDoctorFindings(ctx, opts) };
}

export async function doctor(opts: DoctorOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const run = getRunOptions();
    const runId = String(Date.now());
    const patchingProjectRoot = resolvePatchingProjectRoot(ctx);

    if (run.json) {
      try {
        let envelope = resolveDoctorData(ctx, opts, runId).jsonEnvelope!;
        const readinessList = cliReadinessIssues(ctx, { mode: 'preset', preset: 'doctor' });
        if (readinessList) {
          envelope = { ...envelope, issues: mergeIssues(envelope.issues, readinessList), ok: false };
        }
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
        const envelopeWithPatching = {
          ...envelope,
          issues: mergeIssues(envelope.issues, issuesFromPatchingDiagnostics(patchingAnalysis.diagnostics)),
        };
        const { findings, strict } = envelopeWithPatching.data;
        const code = doctorExitCode(findings, strict);
        console.log(stringifyEnvelope(envelopeWithPatching));
        applyCliCiExitGate(
          code === 0 &&
            !readinessList &&
            patchingAnalysis.diagnostics.every((d) => d.severity !== 'error'),
        );
      } catch (err) {
        const empty: DoctorJsonPayload = {
          kind: 'doctor',
          findings: [],
          strict: Boolean(opts.strict),
        };
        console.log(stringifyEnvelope(buildIoReadFailureEnvelope('doctor', empty, ctx, err)));
        applyCliCiExitGate(false);
      }
      return;
    }

    const findings = resolveDoctorData(ctx, opts, runId).findings!;
    const readinessIssues = cliReadinessIssues(ctx, { mode: 'preset', preset: 'doctor' });
    let baseline = { dynamic: 0, keyObservations: 0 };
    if (!readinessIssues) {
      const coreCtx = createCliCoreContext(ctx);
      const analysis = resolveProjectAnalysis(coreCtx, { emit: createCliRunEmitter(run), op: 'doctor', runId });
      baseline = {
        dynamic: analysis.counts.dynamicActive,
        ...(analysis.counts.dynamicCommented > 0 ? { commented: analysis.counts.dynamicCommented } : {}),
        keyObservations: analysis.keyObservations.length,
      };
    }
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
    for (const d of patchingAnalysis.diagnostics) {
      if (d.severity === 'error') logger.err(d.message);
      else if (d.severity === 'warn') logger.warn(d.message, run);
    }

    let sourceLeaves = 0;
    try {
      const sr = readHostJsonUnknown(ctx.paths.sourceLocale, ctx.adapters.fs);
      sourceLeaves = collectTranslationSurfaceLeaves(sr).length;
    } catch {
      /* source read issues surface via findings / other commands */
    }
    if (baseline.dynamic > 0 && canPrintWarn(run)) {
      logger.warn(
        `${String(baseline.dynamic)} translation call(s) use a non-literal key — run \`i18nprune locales dynamic\` for file:line listings.`,
        run,
      );
    }

    if (findings.length === 0) {
      logger.warn('No checks matched --only (use: runtime,tools,config,paths)', run);
    } else {
      logger.info(`${String(findings.length)} check(s)`, run);
    }
    for (const f of findings) {
      const msg = `  ● ${f.title}${f.detail ? ` — ${f.detail}` : ''}`;
      if (f.severity === 'error') logger.err(msg);
      else if (f.severity === 'warn') logger.warn(msg, run);
      else logger.detail(msg, run);
    }

    const code = doctorExitCode(findings, Boolean(opts.strict));
    printCommandSummary(
      {
        command: 'doctor',
        ok: code === 0 && !readinessIssues,
        durationMs: wall.elapsedMs(),
        counts: {
          checks: findings.length,
          sourceLeaves,
          ...baseline,
        },
        issues: mergeIssues(
          issuesFromDiscoveryWarnings(ctx.meta.warnings),
          issuesFromDoctorFindings(findings),
          issuesFromPatchingDiagnostics(patchingAnalysis.diagnostics),
          issuesFromDynamicScanCount(baseline.dynamic),
          readinessIssues ?? [],
        ),
      },
      { run, adapters: ctx.adapters },
    );

    applyCliCiExitGate(
      code === 0 &&
        !readinessIssues &&
        patchingAnalysis.diagnostics.every((d) => d.severity !== 'error'),
    );
  } finally {
    wall.dispose();
  }
}
