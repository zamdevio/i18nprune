import {
  buildCliJsonEnvelope,
  emitIssuesAsRunErrors,
  emitRunEvent,
  issueCodeRepoDocPathForIssueCode,
  nowMs,
  runValidate as runValidateCore,
  type CliJsonEnvelope,
  type Issue,
  type RuntimeAdapters,
  type RunEmitter,
} from '@i18nprune/core';
import { buildValidateHostHooks } from '@/commands/validate/hooks.js';
import { createCliCoreContext } from '@/shared/context/index.js';
import { normalizeUnknownError } from '@/shared/errors/normalize.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { ValidateJsonOutput, ValidateJsonRunResult, ValidateRuntime } from '@/types/command/validate/index.js';
import { ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED } from '@/constants/issueCodes.js';

export function emptyValidateData(): ValidateJsonOutput {
  return {
    missing: [],
    count: 0,
    dynamic: { count: 0 },
    keyObservations: { count: 0 },
  };
}

function coreContextForValidate(ctx: Context, runtime?: ValidateRuntime) {
  const base = createCliCoreContext(ctx);
  const adapters = runtime?.adapters ?? base.adapters;
  if (adapters === base.adapters) return base;
  return { ...base, adapters } as typeof base;
}

function validateEnvelopeFromThrownError(
  ctx: Context,
  err: unknown,
  runtime?: ValidateRuntime,
): CliJsonEnvelope<'validate', ValidateJsonOutput> {
  const n = normalizeUnknownError(err);
  const readIssue: Issue = {
    severity: 'error',
    code: ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
    message: n.message,
    path: ctx.paths.sourceLocale,
    docPath: issueCodeRepoDocPathForIssueCode(ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED),
  };
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), [readIssue]);
  return buildCliJsonEnvelope('validate', emptyValidateData(), {
    ok: false,
    issues,
    cwd: (runtime?.adapters ?? ctx.adapters).system.cwd(),
  });
}

/**
 * Single call site for core `runValidate` (human + `--json`). Discovery warnings merge here.
 */
export function executeValidateCore(ctx: Context, runtime: ValidateRuntime = {}): ValidateJsonRunResult {
  const coreCtx = coreContextForValidate(ctx, runtime);
  const out = runValidateCore(coreCtx, {}, buildValidateHostHooks(runtime));
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), out.issues);
  const data: ValidateJsonOutput = {
    missing: out.payload.missing,
    count: out.payload.count,
    dynamic: out.payload.dynamic,
    keyObservations: out.payload.keyObservations,
  };
  const readFailed = issues.some((i) => i.code === ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED);
  const envelope = buildCliJsonEnvelope('validate', data, {
    ok: data.missing.length === 0 && !readFailed,
    issues,
    cwd: (runtime.adapters ?? ctx.adapters).system.cwd(),
  });
  return {
    envelope,
    fullDynamicSites: out.fullDynamicSites,
    fullKeyObservations: out.fullKeyObservations,
  };
}

/**
 * Same structured result as `validate --json`: full CLI envelope with `ok`, `data`, and `issues[]`.
 * Read/parse failures (missing source locale, invalid JSON, etc.) return **`ok: false`** and an **`issues[]`**
 * entry; they do not throw, so stdout can stay one JSON envelope for automation.
 *
 * **`Context.adapters`** (from **`resolveContext`**) is the default host: pass **`runtime.adapters`** only to
 * override (e.g. tests or a non-Node host).
 */
export function runValidate(
  ctx: Context,
  runtime?: { emit?: RunEmitter; runId?: string; adapters?: RuntimeAdapters },
): CliJsonEnvelope<'validate', ValidateJsonOutput> {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'validate', runId: runtime?.runId, at: nowMs() });
  try {
    const { envelope } = executeValidateCore(ctx, runtime);
    emitRunEvent(runtime?.emit, {
      type: 'run.progress.validate',
      op: 'validate',
      runId: runtime?.runId,
      at: nowMs(),
      phase: 'done',
      current: 5,
      total: 5,
    });
    if (!envelope.ok) {
      emitIssuesAsRunErrors(runtime?.emit, {
        op: 'validate',
        runId: runtime?.runId,
        issues: envelope.issues,
        recoverable: true,
      });
    }
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'validate',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'validate',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: {
        missing: envelope.data.missing.length,
        dynamic: envelope.data.dynamic.count,
        keyObservations: envelope.data.keyObservations.count,
      },
    });
    return envelope;
  } catch (err: unknown) {
    const envelope = validateEnvelopeFromThrownError(ctx, err, runtime);
    emitIssuesAsRunErrors(runtime?.emit, {
      op: 'validate',
      runId: runtime?.runId,
      issues: envelope.issues,
      recoverable: true,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'validate',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'validate',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: {
        missing: envelope.data.missing.length,
        dynamic: envelope.data.dynamic.count,
        keyObservations: envelope.data.keyObservations.count,
      },
    });
    return envelope;
  }
}
