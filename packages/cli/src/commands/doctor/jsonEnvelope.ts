import { configExists, configPathForContext } from '@/shared/config/index.js';
import { isRipgrepAvailable } from '@/utils/rg/index.js';
import { buildCliJsonEnvelope } from '@i18nprune/core';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDoctorFindings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/shared/result/index.js';
import { resolveDynamicSitesCount } from '@/shared/cache/index.js';
import { emitIssuesAsRunErrors, emitRunErrorFromUnknown, emitRunEvent, nowMs } from '@i18nprune/core';
import { runDoctor as runDoctorCore } from '@i18nprune/core';
import type { DoctorHostHooks, DoctorJsonPayload } from '@i18nprune/core';
import type { CliJsonEnvelope, RunEmitter } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';
import type { DoctorOptions } from '@/types/commands/doctor/index.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { cliEnvelopeCwd } from '@/shared/result/envelopeCwd.js';

function buildDoctorHostHooks(runtime?: { emit?: RunEmitter; runId?: string }): DoctorHostHooks {
  return {
    emit: runtime?.emit,
    runId: runtime?.runId,
    nodeVersion: process.version,
    rgAvailable: isRipgrepAvailable(),
    hasConfigFile: configExists(),
    configPathLabel: configPathForContext(),
  };
}

export function collectDoctorFindings(ctx: Context, opts: DoctorOptions) {
  const coreCtx = createCliCoreContext(ctx);
  const host = buildDoctorHostHooks();
  return runDoctorCore(coreCtx, { only: opts.only, strict: opts.strict }, host).payload.findings;
}

export function runDoctor(
  ctx: Context,
  opts: DoctorOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): CliJsonEnvelope<'doctor', DoctorJsonPayload> {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'doctor', runId: runtime?.runId, at: nowMs() });
  try {
    const coreCtx = createCliCoreContext(ctx);
    const host = buildDoctorHostHooks(runtime);
    const result = runDoctorCore(coreCtx, { only: opts.only, strict: opts.strict }, host);
    const dynamicKeySites = resolveDynamicSitesCount(ctx);
    const issues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDoctorFindings(result.payload.findings),
      issuesFromDynamicScanCount(dynamicKeySites),
    );
    const envelope = buildCliJsonEnvelope('doctor', result.payload, {
      ok: result.exitCode === 0,
      issues,
      cwd: cliEnvelopeCwd(ctx),
    });
    if (!envelope.ok) {
      emitIssuesAsRunErrors(runtime?.emit, {
        op: 'doctor',
        runId: runtime?.runId,
        issues: envelope.issues,
        recoverable: false,
      });
    }
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'doctor',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'doctor',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: { findings: result.payload.findings.length },
    });
    return envelope;
  } catch (err) {
    emitRunErrorFromUnknown(runtime?.emit, {
      op: 'doctor',
      runId: runtime?.runId,
      err,
      code: 'i18nprune.run.doctor_failed',
      recoverable: false,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.failed',
      op: 'doctor',
      runId: runtime?.runId,
      at: nowMs(),
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      },
    });
    throw err;
  }
}
