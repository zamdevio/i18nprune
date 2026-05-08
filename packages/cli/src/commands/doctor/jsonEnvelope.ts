import { configExists, configPathForContext } from '@/shared/config/index.js';
import { isRipgrepAvailable } from '@/utils/rg/index.js';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDoctorFindings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { DoctorOptions } from '@/types/commands/doctor/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import type { DoctorFinding } from '@i18nprune/core/types';
import { collectDoctorFindingsFromInputs, doctorExitCode } from '@i18nprune/core';
import { emitIssuesAsRunErrors, emitRunErrorFromUnknown, emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEmitter } from '@i18nprune/core';
import { existsRuntimeFsSync } from '@i18nprune/core';
import { resolveDynamicSitesCount } from '@/shared/cache/index.js';

export function collectDoctorFindings(ctx: Context, opts: DoctorOptions): DoctorFinding[] {
  return collectDoctorFindingsFromInputs({
    onlyRaw: opts.only,
    nodeVersion: process.version,
    rgAvailable: isRipgrepAvailable(),
    hasConfigFile: configExists(),
    configPathLabel: configPathForContext(),
    paths: {
      sourceLocale: ctx.paths.sourceLocale,
      localesDir: ctx.paths.localesDir,
      srcRoot: ctx.paths.srcRoot,
      pathExists: (p) => existsRuntimeFsSync(p, ctx.adapters.fs),
    },
  });
}

export function runDoctor(
  ctx: Context,
  opts: DoctorOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): CliJsonEnvelope<'doctor', DoctorJsonData> {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'doctor', runId: runtime?.runId, at: nowMs() });
  try {
    const findings = collectDoctorFindings(ctx, opts);
    const dynamicKeySites = resolveDynamicSitesCount(ctx);
    const strict = Boolean(opts.strict);
    const code = doctorExitCode(findings, strict);
    const data: DoctorJsonData = {
      kind: 'doctor',
      findings,
      strict,
    };
    const issues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDoctorFindings(findings),
      issuesFromDynamicScanCount(dynamicKeySites),
    );
    const envelope = buildCliJsonEnvelope('doctor', data, {
      ok: code === 0,
      issues,
      cwd: process.cwd(),
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
      counts: { findings: findings.length },
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

type DoctorJsonData = {
  kind: 'doctor';
  findings: DoctorFinding[];
  strict: boolean;
};
