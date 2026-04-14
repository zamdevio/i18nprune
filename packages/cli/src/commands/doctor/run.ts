import { resolveContext } from '@/core/context/index.js';
import {
  DOCTOR_CHECK_IDS,
  collectDoctorFindings,
  doctorExitCode,
  runDoctor,
} from '@/core/doctor/jsonEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDoctorFindings,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { getRunOptions } from '@/core/runtime/options.js';
import { logger } from '@/utils/logger/index.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { DoctorFinding, DoctorOptions } from '@/types/commands/doctor/index.js';

export { DOCTOR_CHECK_IDS };

export async function doctor(opts: DoctorOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const run = getRunOptions();

  if (run.json) {
    try {
      const envelope = runDoctor(ctx, opts);
      const { findings, strict } = envelope.data;
      const code = doctorExitCode(findings, strict);
      console.log(stringifyEnvelope(envelope));
      pushReportEntry({
        command: 'doctor',
        level: code === 0 ? 'info' : 'warn',
        message: `doctor completed with ${String(findings.length)} check(s)`,
        data: {
          strict,
          errors: findings.filter((f) => f.severity === 'error').length,
          warns: findings.filter((f) => f.severity === 'warn').length,
        },
      });
      await finalizeReportFile(ctx.config, {
        command: 'doctor',
        durationMs: Date.now() - started,
        counts: {
          checks: findings.length,
          errors: findings.filter((f) => f.severity === 'error').length,
          warns: findings.filter((f) => f.severity === 'warn').length,
        },
      });
      process.exitCode = code;
    } catch (err) {
      const empty = {
        kind: 'doctor' as const,
        findings: [] as DoctorFinding[],
        strict: Boolean(opts.strict),
      };
      console.log(stringifyEnvelope(buildIoReadFailureEnvelope('doctor', empty, ctx, err)));
      process.exitCode = 1;
      await finalizeReportFile(ctx.config, {
        command: 'doctor',
        ok: false,
        durationMs: Date.now() - started,
        counts: {},
      });
    }
    return;
  }

  const findings = collectDoctorFindings(ctx, opts);

  if (findings.length === 0) {
    logger.warn('No checks matched --only (use: runtime,tools,config,paths)', run);
  } else {
    logger.info(`doctor: ${String(findings.length)} check(s)`, run);
  }
  for (const f of findings) {
    const msg = `${f.title}${f.detail ? ` — ${f.detail}` : ''}`;
    if (f.severity === 'error') logger.err(msg);
    else if (f.severity === 'warn') logger.warn(msg, run);
    else logger.detail(msg, run);
  }

  const code = doctorExitCode(findings, Boolean(opts.strict));
  pushReportEntry({
    command: 'doctor',
    level: code === 0 ? 'info' : 'warn',
    message: `doctor completed with ${String(findings.length)} check(s)`,
    data: {
      strict: Boolean(opts.strict),
      errors: findings.filter((f) => f.severity === 'error').length,
      warns: findings.filter((f) => f.severity === 'warn').length,
    },
  });
  finalizeReportFile(ctx.config, {
    command: 'doctor',
    durationMs: Date.now() - started,
    counts: {
      checks: findings.length,
      errors: findings.filter((f) => f.severity === 'error').length,
      warns: findings.filter((f) => f.severity === 'warn').length,
    },
  });
  printCommandSummary(
    {
      command: 'doctor',
      ok: code === 0,
      durationMs: Date.now() - started,
      issues: mergeIssues(
        issuesFromDiscoveryWarnings(ctx.meta.warnings),
        issuesFromDoctorFindings(findings),
      ),
    },
    { run },
  );

  process.exitCode = code;
}
