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
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { invalidateProjectAnalysisCacheForContext } from '@/shared/cache/index.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { mergeIssues } from '@/shared/result/index.js';
import { resolveConfigFilePathForRoot } from '@/shared/config/paths.js';
import { ProtocolError, SERV_ISSUE } from './errors.js';
import { JSONRPC_INVALID_REQUEST } from './protocol.js';
import type { SyncOptions } from '@/types/command/sync/index.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';

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
export type ServeWriteOpId = 'sync' | 'generate';

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
  // Cancellation is observed at dispatch boundaries only: core accepts no AbortSignal, so a cancelled
  // request is refused before the (synchronous) op starts rather than interrupted mid-flight. See
  // `SERVE_CANCELLATION_SUPPORTED`.
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

  switch (id) {
    case 'config': {
      const envelope = runConfig(context, resolveConfigFilePathForRoot(ctx.projectRoot)) as CliJsonEnvelope<string, unknown>;
      return { envelope, json: stringifyEnvelope(envelope) };
    }
    case 'providers': {
      const envelope = runProviders(context) as CliJsonEnvelope<string, unknown>;
      return { envelope, json: stringifyEnvelope(envelope) };
    }
    case 'validate': {
      const envelope = validateEnvelope(context, { emit, runId });
      return { envelope, json: stringifyEnvelope(envelope) };
    }
    case 'doctor': {
      const envelope = doctorEnvelope(context, ctx.projectRoot, ctx.options);
      return { envelope, json: stringifyEnvelope(envelope) };
    }
    case 'sync': {
      const envelope = await syncEnvelope(context, ctx, { emit, runId });
      return { envelope, json: stringifyEnvelope(envelope) };
    }
    case 'generate': {
      const envelope = await generateEnvelope(context, ctx, { emit, runId });
      return { envelope, json: stringifyEnvelope(envelope) };
    }
    default: {
      const exhaustive: never = id;
      throw new Error(`Unhandled serve op: ${String(exhaustive)}`);
    }
  }
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
  runtime: { emit?: RunEmitter; runId?: string },
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
  runtime: { emit?: RunEmitter; runId?: string },
): Promise<CliJsonEnvelope<string, unknown>> {
  const opts = mergeGenerateOptionsFromEnv(generateOptionsFrom(ctx.options));
  const envelope = (await runGenerateJsonEnvelope(context, opts, {
    emit: runtime.emit ?? noopRunEmitter,
    runId: runtime.runId ?? String(Date.now()),
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
