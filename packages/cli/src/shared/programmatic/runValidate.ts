import {
  buildValidateIssues,
  buildValidateScanPayload,
  emitIssuesAsRunErrors,
  emitRunEvent,
  extractor,
  issueCodeRepoDocPathForIssueCode,
  nowMs,
  readJsonFromRuntimeFsSync,
  type RuntimeAdapters,
  type RunEmitter,
} from '@i18nprune/core';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import { normalizeUnknownError } from '@/shared/errors/normalize.js';
import { ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED } from '@/constants/issueCodes.js';
import type { Context } from '@/types/core/context/index.js';
import type { ValidateJsonOutput } from '@/types/command/validate/index.js';
import type { CliJsonEnvelope, Issue } from '@/types/core/json/envelope.js';

function emptyValidateData(): ValidateJsonOutput {
  return {
    missing: [],
    count: 0,
    dynamic: { count: 0, sites: [] },
    keyObservations: { count: 0, observations: [] },
  };
}

function validateEnvelopeFromThrownError(
  ctx: Context,
  err: unknown,
  cwd: string,
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
    cwd,
  });
}

function runValidateCore(
  ctx: Context,
  runtime?: { emit?: RunEmitter; runId?: string; adapters?: RuntimeAdapters },
): CliJsonEnvelope<'validate', ValidateJsonOutput> {
  const adapters = runtime?.adapters ?? ctx.adapters;
  const cwd = adapters.system.cwd();
  const listWindow = resolveCliListWindow(ctx.config);
  const emit = runtime?.emit;
  const runId = runtime?.runId;
  emitRunEvent(emit, {
    type: 'run.progress.validate',
    op: 'validate',
    runId,
    at: nowMs(),
    phase: 'read_source',
    label: ctx.paths.sourceLocale,
  });
  const raw = readJsonFromRuntimeFsSync(ctx.paths.sourceLocale, adapters.fs);
  emitRunEvent(emit, { type: 'run.progress.validate', op: 'validate', runId, at: nowMs(), phase: 'scan_sources' });
  const scanInput = toExtractorScanInput(ctx);
  const keyObservations = extractor.keySites.scanProjectKeyObservations(scanInput);
  emitRunEvent(emit, {
    type: 'run.progress.validate',
    op: 'validate',
    runId,
    at: nowMs(),
    phase: 'extract_keys',
    current: keyObservations.length,
    total: keyObservations.length,
  });
  const resolvedKeys = extractor.keySites.resolvedKeysFromObservations(keyObservations);
  const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites(scanInput);
  emitRunEvent(emit, {
    type: 'run.progress.validate',
    op: 'validate',
    runId,
    at: nowMs(),
    phase: 'compare',
    current: resolvedKeys.size,
    total: resolvedKeys.size,
  });
  const data: ValidateJsonOutput = buildValidateScanPayload({
    sourceLocaleJson: raw,
    resolvedKeys,
    keyObservations,
    dynamicSites,
    window: listWindow,
  });
  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    buildValidateIssues({
      missingCount: data.missing.length,
      dynamicSiteCount: dynamicSites.length,
      sourceLocalePath: ctx.paths.sourceLocale,
    }),
  );
  const ok = data.missing.length === 0;
  return buildCliJsonEnvelope('validate', data, {
    ok,
    issues,
    cwd,
  });
}

/**
 * Same structured result as `validate --json`: full CLI envelope with `ok`, `data`, and `issues[]`.
 * Read/parse failures (missing source locale, invalid JSON, etc.) return **`ok: false`** and an **`issues[]`**
 * entry — they do not throw, so stdout is always one JSON envelope for automation.
 *
 * **`Context.adapters`** (from **`resolveContext`**) is the default host: source JSON is read with
 * **`readJsonFromRuntimeFsSync`** and **`meta.cwd`** uses **`adapters.system.cwd()`**. Pass
 * **`runtime.adapters`** only to override (e.g. tests or a non-Node host).
 */
export function runValidate(
  ctx: Context,
  runtime?: { emit?: RunEmitter; runId?: string; adapters?: RuntimeAdapters },
): CliJsonEnvelope<'validate', ValidateJsonOutput> {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'validate', runId: runtime?.runId, at: nowMs() });
  try {
    const envelope = runValidateCore(ctx, runtime);
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
    const envelope = validateEnvelopeFromThrownError(
      ctx,
      err,
      (runtime?.adapters ?? ctx.adapters).system.cwd(),
    );
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
