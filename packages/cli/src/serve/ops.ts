import { stringifyEnvelope, buildCliJsonEnvelope, noopRunEmitter, type CliJsonEnvelope, type RunEmitter } from '@i18nprune/core';
import type { Context, CliGlobalOverrides } from '@/types/core/context/index.js';
import { runConfig } from '@/commands/config/jsonEnvelope.js';
import { runDoctor } from '@/commands/doctor/jsonEnvelope.js';
import { runValidate, emptyValidateData } from '@/commands/validate/jsonEnvelope.js';
import { runLanguages } from '@/commands/languages/jsonEnvelope.js';
import { runProviders } from '@/commands/providers/jsonEnvelope.js';
import { runSyncJsonEnvelope, emptySyncPayload } from '@/commands/sync/jsonEnvelope.js';
import { runGenerateJsonEnvelope } from '@/commands/generate/jsonEnvelope.js';
import { mergeGenerateOptionsFromEnv } from '@/commands/generate/env.js';
import { executeCleanupWrite, emptyCleanupPayload } from '@/commands/cleanup/jsonEnvelope.js';
import { executeLocalesDelete } from '@/commands/locales/deleteJsonEnvelope.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { invalidateProjectAnalysisCacheForContext } from '@/shared/cache/index.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { mergeIssues } from '@/shared/result/index.js';
import { resolveConfigFilePathForRoot } from '@/shared/config/paths.js';
import { ProtocolError, SERV_ISSUE } from './errors.js';
import { JSONRPC_INVALID_REQUEST } from './protocol.js';
import type { SyncOptions } from '@/types/command/sync/index.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CleanupJsonOutput } from '@i18nprune/core';

/**
 * A read-only operation a `serve` client can invoke. Each mirrors the matching CLI command's
 * `--json` output (ADR 012 §4: results reuse the CLI JSON envelope).
 */
export type ServeReadOpId = 'config' | 'doctor' | 'validate' | 'languages' | 'providers';

/**
 * A write operation a `serve` client can invoke (opt-in via `--allow-writes`). Each mutates disk and
 * mirrors the matching CLI command's `--json` output, including the post-envelope side effects the
 * CLI would run (patching, cache invalidation).
 */
export type ServeWriteOpId = 'sync' | 'generate' | 'cleanup' | 'locales.delete';

/** Every op this server can serve. */
export type ServeOpId = ServeReadOpId | ServeWriteOpId;

/** `op.<id>` JSON-RPC method → read op id. */
export const SERVE_READ_OP_METHODS = {
  'op.config': 'config',
  'op.doctor': 'doctor',
  'op.validate': 'validate',
  'op.languages': 'languages',
  'op.providers': 'providers',
} as const satisfies Record<string, ServeReadOpId>;

/** `op.<id>` JSON-RPC method → write op id. */
export const SERVE_WRITE_OP_METHODS = {
  'op.sync': 'sync',
  'op.generate': 'generate',
  'op.cleanup': 'cleanup',
  'op.locales.delete': 'locales.delete',
} as const satisfies Record<string, ServeWriteOpId>;

/** `op.<id>` JSON-RPC method → op id, across reads and writes. */
export const SERVE_OP_METHODS: Record<string, ServeOpId> = {
  ...SERVE_READ_OP_METHODS,
  ...SERVE_WRITE_OP_METHODS,
};

export type ServeReadOpContext = {
  /** Resolved project root (sandbox pin or hub request root). */
  readonly projectRoot: string;
  /** Per-session RunOptions — serve runs with `json: true` so envelope bytes match `--json`. */
  readonly run: Context['run'];
  /** Host CLI overrides (serve: empty). */
  readonly cliOverrides: CliGlobalOverrides;
  /** Op request `params.options` passthrough (e.g. `{ only, strict, filter, table }`). */
  readonly options: Record<string, unknown>;
  /**
   * `false` for a read-only session: context resolution forces the project cache read-only so no
   * cache file or directory is written. `true` only once the session has `--allow-writes`.
   */
  readonly allowWrites: boolean;
  /**
   * JSON-RPC request id for this op, used as the `$/progress` key. `undefined` disables progress
   * forwarding (and uses the no-op emitter, so envelopes stay byte-identical).
   */
  readonly progressId?: string | number;
  /** Forward a `run.*` event to the client as `$/progress`. No-op when absent. */
  readonly emit?: RunEmitter;
  /** Aborted when the client cancels this request before dispatch. Checked before any core call. */
  readonly signal?: AbortSignal;
  /** Lazily resolve the per-root context (session-backed cache). `languages` never calls it. */
  readonly getContext: (allowWrites?: boolean) => Promise<Context>;
  /**
   * Called after a write op mutates disk, so the session can drop that root's cached context (its
   * `localeRead` and analysis state are now stale). No-op for read ops.
   */
  readonly onWrote?: (root: string) => void;
};

export type ServeReadOpResult = {
  readonly envelope: CliJsonEnvelope<string, unknown>;
  /** Exact CLI stdout bytes for this envelope (pretty-printing included). */
  readonly json: string;
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Run one op and return the envelope plus its serialized form. Never writes to any stream — the
 * session owns stdout. Write ops are gated on `ctx.allowWrites`; a read-only session gets a
 * `SERVE_WRITES_DISABLED` error before any core call.
 */
export async function runServeOp(id: ServeOpId, ctx: ServeReadOpContext): Promise<ServeReadOpResult> {
  // Cancellation is checked here (pre-dispatch) and again after the op: a request cancelled before it
  // starts is refused with `SERVE_REQUEST_CANCELLED`, and a long op that is cancelled mid-flight
  // aborts at a core await boundary (surfaced by the session as `SERVE_REQUEST_CANCELLED`).
  if (ctx.signal?.aborted) {
    throw new ProtocolError(JSONRPC_INVALID_REQUEST, 'Request cancelled', SERV_ISSUE.requestCancelled);
  }

  const emit = ctx.emit;
  const runId = ctx.progressId === undefined ? undefined : String(ctx.progressId);

  // `languages` is a static catalog: no project config, no context resolve.
  if (id === 'languages') {
    const envelope = runLanguages(
      { filter: asString(ctx.options.filter), table: asBoolean(ctx.options.table) },
      ctx.projectRoot,
    ) as CliJsonEnvelope<string, unknown>;
    return { envelope, json: stringifyEnvelope(envelope) };
  }

  const context = await ctx.getContext(ctx.allowWrites);

  if (ctx.signal?.aborted) {
    throw new ProtocolError(JSONRPC_INVALID_REQUEST, 'Request cancelled', SERV_ISSUE.requestCancelled);
  }

  const envelope = await (async (): Promise<CliJsonEnvelope<string, unknown>> => {
    switch (id) {
      case 'config':
        return runConfig(context, resolveConfigFilePathForRoot(ctx.projectRoot)) as CliJsonEnvelope<string, unknown>;
      case 'providers':
        return runProviders(context) as CliJsonEnvelope<string, unknown>;
      case 'validate':
        return validateEnvelope(context, { emit, runId });
      case 'doctor':
        return doctorEnvelope(context, ctx.projectRoot, ctx.options);
      case 'sync':
        return await syncEnvelope(context, ctx, { emit, runId, signal: ctx.signal });
      case 'generate':
        return await generateEnvelope(context, ctx, { emit, runId, signal: ctx.signal });
      case 'cleanup':
        return cleanupEnvelope(context, ctx, { emit, runId });
      case 'locales.delete':
        return await localesDeleteEnvelope(context, ctx);
      default: {
        const exhaustive: never = id;
        throw new Error(`Unhandled serve op: ${String(exhaustive)}`);
      }
    }
  })();

  // Final cancellation gate. Core ops abort at their await boundaries and throw an `AbortError`
  // (surfaced by the session as `SERVE_REQUEST_CANCELLED`), but a long op with nothing left to await
  // can still finish after a late cancel — this check guarantees the client always sees the cancel
  // rather than a result it explicitly walked away from.
  if (ctx.signal?.aborted) {
    throw new ProtocolError(JSONRPC_INVALID_REQUEST, 'Request cancelled', SERV_ISSUE.requestCancelled);
  }

  return { envelope, json: stringifyEnvelope(envelope) };
}

/**
 * Validate `--json` orchestration: a blocking readiness issue short-circuits to an empty envelope,
 * otherwise the core result is returned. Mirrors `commands/validate/run.ts` json branch.
 *
 * Progress flows through `runValidate`, which emits `run.started` / `run.progress.validate` /
 * `run.completed` / `run.summary`; with no emitter those events are no-ops and the envelope is
 * byte-identical to the CLI's.
 */
function validateEnvelope(context: Context, runtime: { emit?: RunEmitter; runId?: string }): CliJsonEnvelope<string, unknown> {
  const readinessIssues = cliReadinessIssues(context, { mode: 'preset', preset: 'validate' });
  if (readinessIssues) {
    return buildCliJsonEnvelope('validate', emptyValidateData(), {
      ok: false,
      issues: readinessIssues,
      cwd: context.adapters.system.cwd(),
    }) as CliJsonEnvelope<string, unknown>;
  }
  return runValidate(context, {
    emit: runtime.emit ?? noopRunEmitter,
    runId: runtime.runId ?? String(Date.now()),
  }) as CliJsonEnvelope<string, unknown>;
}

/**
 * Doctor `--json` orchestration: core findings + readiness. The doctor exit code is a CLI concern
 * (exit gate), so `ok` here reflects findings + readiness only — unlike the CLI, which also folds in
 * the exit-code gate.
 */
function doctorEnvelope(
  context: Context,
  projectRoot: string,
  options: Record<string, unknown>,
): CliJsonEnvelope<string, unknown> {
  const configPath = resolveConfigFilePathForRoot(projectRoot);
  let envelope = runDoctor(
    context,
    { only: asString(options.only), strict: asBoolean(options.strict) },
    {
      emit: noopRunEmitter,
      runId: String(Date.now()),
      hostConfig: { hasConfigFile: configPath !== null, configPathLabel: configPath },
    },
  ) as CliJsonEnvelope<string, unknown>;
  const readinessList = cliReadinessIssues(context, { mode: 'preset', preset: 'doctor' });
  if (readinessList) {
    envelope = { ...envelope, issues: mergeIssues(envelope.issues, readinessList), ok: false };
  }
  return envelope;
}

/**
 * Sync `--json` orchestration, write-capable. Mirrors the CLI's `--json` branch of
 * `commands/sync/run.ts`: readiness short-circuit, core sync, then the post-envelope side effects the
 * CLI also runs — best-effort patching and analysis-cache invalidation — and finally drops the root's
 * cached context so the next read sees the new files.
 */
async function syncEnvelope(
  context: Context,
  ctx: ServeReadOpContext,
  runtime: { emit?: RunEmitter; runId?: string; signal?: AbortSignal },
): Promise<CliJsonEnvelope<string, unknown>> {
  const opts = syncOptionsFrom(ctx.options);
  const readiness = cliReadinessIssues(context, { mode: 'preset', preset: 'sync' });
  if (readiness) {
    return buildCliJsonEnvelope('sync', emptySyncPayload(context, opts), {
      ok: false,
      issues: readiness,
      cwd: context.adapters.system.cwd(),
    }) as CliJsonEnvelope<string, unknown>;
  }

  const { envelope, result } = runSyncJsonEnvelope(context, opts, {
    emit: runtime.emit ?? noopRunEmitter,
    runId: runtime.runId ?? String(Date.now()),
  });

  if (result !== undefined) {
    const { fileLines, updated } = result;
    if (opts.dryRun !== true && updated > 0) {
      const changedLocaleCodes = fileLines
        .filter((row) => row.changed)
        .map((row) => context.adapters.path.basename(row.path, '.json'));
      await applyCommandPatching({
        ctx: context,
        command: 'sync',
        action: 'upsert_locales',
        localeCodes: changedLocaleCodes,
      });
      const writtenLocalePaths = fileLines.filter((row) => row.changed).map((row) => row.path);
      invalidateProjectAnalysisCacheForContext(context, { writtenLocalePaths });
      // The root's locale files changed on disk: drop the cached context so the next read re-reads.
      ctx.onWrote?.(ctx.projectRoot);
    }
  }

  return envelope as CliJsonEnvelope<string, unknown>;
}

/** Map `params.options` to core `SyncOptions`, accepting only known keys (unknown keys ignored). */
function syncOptionsFrom(options: Record<string, unknown>): SyncOptions {
  return {
    dryRun: asBoolean(options.dryRun),
    target: asString(options.target),
    metadata: asBoolean(options.metadata),
    stripMetadata: asBoolean(options.stripMetadata),
    noRepairSentinelLeaks: asBoolean(options.noRepairSentinelLeaks),
  };
}

/**
 * Generate `--json` orchestration, write-capable. Mirrors the CLI's `--json` branch of
 * `commands/generate/run.ts`: readiness short-circuit, env-merged options, `runGenerateJsonEnvelope`,
 * then on a successful non-dry-run the post-envelope side effects the CLI also runs — patching and
 * analysis-cache invalidation — and finally drops the root's cached context.
 *
 * A serve client is non-interactive, so `runGenerateJsonEnvelope` throws a USAGE issue envelope for
 * the cases the CLI would prompt for (missing `--target`, resume target selection). That envelope is
 * returned as-is (`ok: false`) rather than surfaced as a transport error.
 */
async function generateEnvelope(
  context: Context,
  ctx: ServeReadOpContext,
  runtime: { emit?: RunEmitter; runId?: string; signal?: AbortSignal },
): Promise<CliJsonEnvelope<string, unknown>> {
  const opts = mergeGenerateOptionsFromEnv(generateOptionsFrom(ctx.options));
  const envelope = (await runGenerateJsonEnvelope(context, opts, {
    emit: runtime.emit ?? noopRunEmitter,
    runId: runtime.runId ?? String(Date.now()),
    ...(runtime.signal !== undefined ? { signal: runtime.signal } : {}),
  })) as CliJsonEnvelope<'generate', { targetResults: GenerateTargetResult[] }>;

  if (envelope.ok && opts.dryRun !== true) {
    const written = envelope.data.targetResults.filter((row) => row.status === 'written');
    await applyCommandPatching({
      ctx: context,
      command: 'generate',
      action: 'upsert_locales',
      localeCodes: written.map((row) => row.target),
    });
    const writtenLocalePaths = written.flatMap(
      (row) => row.paths?.localeJsonPaths ?? (row.paths?.localeJson ? [row.paths.localeJson] : []),
    );
    invalidateProjectAnalysisCacheForContext(context, { writtenLocalePaths });
    if (writtenLocalePaths.length > 0) {
      ctx.onWrote?.(ctx.projectRoot);
    }
  }

  return envelope as unknown as CliJsonEnvelope<string, unknown>;
}

/** The slice of a generate target result these side effects read (rest is untouched). */
type GenerateTargetResult = {
  target: string;
  status: string;
  paths?: { localeJson?: string; localeJsonPaths?: readonly string[] };
};

/** Map `params.options` to `GenerateOptions`, accepting only known keys (unknown keys ignored). */
function generateOptionsFrom(options: Record<string, unknown>): GenerateOptions {
  return {
    provider: asString(options.provider),
    workers: asNumber(options.workers),
    source: asString(options.source),
    target: asString(options.target),
    force: asBoolean(options.force),
    dryRun: asBoolean(options.dryRun),
    metadata: asBoolean(options.metadata),
    resume: asBoolean(options.resume),
    all: asBoolean(options.all),
    ask: asBoolean(options.ask),
    noRepairSentinelLeaks: asBoolean(options.noRepairSentinelLeaks),
  };
}

/**
 * Cleanup `--json` orchestration, write-capable. Unlike the CLI — where `cleanup --json` is
 * report-only and writes live only on the human path — this removes every `safeToRemove` key and then
 * invalidates the analysis cache and drops the root's cached context. `dryRun` reports without
 * writing. Non-interactive: no key/target prompts (a serve client gates via `--allow-writes`).
 *
 * The `summary` block mirrors the CLI's final envelope (wall-clock `durationMs` inclusive).
 */
function cleanupEnvelope(
  context: Context,
  ctx: ServeReadOpContext,
  runtime: { emit?: RunEmitter; runId?: string },
): CliJsonEnvelope<string, unknown> {
  const startedAt = Date.now();
  const opts = cleanupOptionsFrom(ctx.options);
  const readiness = cliReadinessIssues(context, { mode: 'preset', preset: 'cleanup' });
  if (readiness) {
    const envelope = buildCliJsonEnvelope('cleanup', emptyCleanupPayload(), {
      ok: false,
      issues: readiness,
      cwd: context.adapters.system.cwd(),
    });
    return withCleanupSummary(envelope as CliJsonEnvelope<'cleanup', CleanupJsonOutput>, startedAt);
  }

  const { envelope, writtenPaths } = executeCleanupWrite(context, opts, {
    emit: runtime.emit ?? noopRunEmitter,
    runId: runtime.runId ?? String(Date.now()),
  });
  if (writtenPaths.length > 0) {
    invalidateProjectAnalysisCacheForContext(context, { writtenLocalePaths: writtenPaths });
    ctx.onWrote?.(ctx.projectRoot);
  }
  return withCleanupSummary(envelope, startedAt);
}

/** Attach the CLI's `summary` block (duration, ok, counts) to a cleanup envelope. */
function withCleanupSummary(
  envelope: CliJsonEnvelope<'cleanup', CleanupJsonOutput>,
  startedAt: number,
): CliJsonEnvelope<string, unknown> {
  const d = envelope.data;
  return {
    ...envelope,
    data: {
      ...d,
      summary: {
        durationMs: Date.now() - startedAt,
        command: 'cleanup',
        ok: envelope.ok,
        counts: {
          remove: d.wouldRemove,
          dynamic: d.dynamicActive,
          ...(d.dynamicCommented > 0 ? { commented: d.dynamicCommented } : {}),
        },
      },
    },
  } as CliJsonEnvelope<string, unknown>;
}

/** Map `params.options` to `CleanupOptions`, accepting only known keys (unknown keys ignored). */
function cleanupOptionsFrom(options: Record<string, unknown>): CleanupOptions {
  return {
    dryRun: asBoolean(options.dryRun),
    target: asString(options.target),
    rg: asBoolean(options.rg),
    top: asNumber(options.top),
    full: asBoolean(options.full),
  };
}

/**
 * Locales-delete `--json` orchestration, write-capable. Delegates to `executeLocalesDelete` (the
 * reusable, non-interactive core of `locales delete`): resolve targets, delete the segment files,
 * best-effort patching. Non-interactive — a missing `target` is a USAGE issue envelope, never a
 * prompt. On a real delete, drops the root's cached context so the next read sees the files gone.
 */
async function localesDeleteEnvelope(
  context: Context,
  ctx: ServeReadOpContext,
): Promise<CliJsonEnvelope<string, unknown>> {
  const result = await executeLocalesDelete(context, { target: asString(ctx.options.target) });
  if (result.deletedPaths.length > 0) {
    ctx.onWrote?.(ctx.projectRoot);
  }
  return result.envelope as CliJsonEnvelope<string, unknown>;
}
