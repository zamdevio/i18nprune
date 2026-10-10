import { stringifyEnvelope, buildCliJsonEnvelope, noopRunEmitter, type CliJsonEnvelope } from '@i18nprune/core';
import type { Context, CliGlobalOverrides } from '@/types/core/context/index.js';
import { runConfig } from '@/commands/config/jsonEnvelope.js';
import { runDoctor } from '@/commands/doctor/jsonEnvelope.js';
import { executeValidateCore, emptyValidateData } from '@/commands/validate/jsonEnvelope.js';
import { runLanguages } from '@/commands/languages/jsonEnvelope.js';
import { runProviders } from '@/commands/providers/jsonEnvelope.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { mergeIssues } from '@/shared/result/index.js';
import { resolveConfigFilePathForRoot } from '@/shared/config/paths.js';

/**
 * A read-only operation a `serve` client can invoke. Each mirrors the matching CLI command's
 * `--json` output (ADR 012 §4: results reuse the CLI JSON envelope).
 */
export type ServeReadOpId = 'config' | 'doctor' | 'validate' | 'languages' | 'providers';

/** `op.<id>` JSON-RPC method → read op id. */
export const SERVE_READ_OP_METHODS = {
  'op.config': 'config',
  'op.doctor': 'doctor',
  'op.validate': 'validate',
  'op.languages': 'languages',
  'op.providers': 'providers',
} as const satisfies Record<string, ServeReadOpId>;

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
  /** Lazily resolve the per-root context (session-backed cache). `languages` never calls it. */
  readonly getContext: (allowWrites?: boolean) => Promise<Context>;
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

/**
 * Run one read op and return the envelope plus its serialized form. Never writes to any stream —
 * the session owns stdout.
 */
export async function runServeReadOp(id: ServeReadOpId, ctx: ServeReadOpContext): Promise<ServeReadOpResult> {
  // `languages` is a static catalog: no project config, no context resolve.
  if (id === 'languages') {
    const envelope = runLanguages(
      { filter: asString(ctx.options.filter), table: asBoolean(ctx.options.table) },
      ctx.projectRoot,
    ) as CliJsonEnvelope<string, unknown>;
    return { envelope, json: stringifyEnvelope(envelope) };
  }

  const context = await ctx.getContext(ctx.allowWrites);

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
      const envelope = validateEnvelope(context);
      return { envelope, json: stringifyEnvelope(envelope) };
    }
    case 'doctor': {
      const envelope = doctorEnvelope(context, ctx.projectRoot, ctx.options);
      return { envelope, json: stringifyEnvelope(envelope) };
    }
    default: {
      const exhaustive: never = id;
      throw new Error(`Unhandled serve read op: ${String(exhaustive)}`);
    }
  }
}

/**
 * Validate `--json` orchestration: a blocking readiness issue short-circuits to an empty envelope,
 * otherwise the core result is returned. Mirrors `commands/validate/run.ts` json branch.
 */
function validateEnvelope(context: Context): CliJsonEnvelope<string, unknown> {
  const readinessIssues = cliReadinessIssues(context, { mode: 'preset', preset: 'validate' });
  if (readinessIssues) {
    return buildCliJsonEnvelope('validate', emptyValidateData(), {
      ok: false,
      issues: readinessIssues,
      cwd: context.adapters.system.cwd(),
    }) as CliJsonEnvelope<string, unknown>;
  }
  const { envelope } = executeValidateCore(context, { runId: String(Date.now()), emit: noopRunEmitter });
  return envelope as CliJsonEnvelope<string, unknown>;
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
