/**
 * CLI entry: **`i18nprune generate`**. Single-file command shell.
 *
 * Owns: argv merge, context resolution, dynamic-sites scan, source read, target prompt, building
 * **`CoreContext`** + **`GenerateHostHooks`**, calling core **`runGenerate`**, JSON envelope vs human
 * summary rendering, and post-success patching / cache refresh.
 *
 * Anything orchestration-heavy (translate, fallback, identity, file IO) lives in
 * **`@i18nprune/core/generate`**'s **`runGenerate`** and is reused by SDK consumers.
 */

import {
  createCoreContext,
  emitIssuesAsRunErrors,
  emitRunErrorFromUnknown,
  emitRunEvent,
  I18nPruneError,
  noopRunEmitter,
  normalizeLanguageCode,
  nowMs,
  parseLocaleCodesList,
  pickTargetSelector,
  runGenerate,
} from '@i18nprune/core';
import type { GenerateHostHooks, RunEmitter, RunEvent } from '@i18nprune/core';

import { canAsk } from '@/shared/ask/index.js';
import {
  refreshProjectReportCache,
  resolveExtractionBaselineCounts,
  resolveLocalesDynamicSites,
} from '@/shared/cache/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { resolveContext } from '@/shared/context/index.js';
import { rows, up } from '@/shared/cursor/index.js';
import { readHostJsonUnknown } from '@/shared/io/hostJson.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { createSessionProgress } from '@/shared/progress/session.js';
import { createGenerateTickProgressRelay } from '@/shared/progress/tickRelay.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
  usageIssueFromI18nPruneError,
} from '@/shared/result/cliEnvelopeIssues.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import { logTranslateFailureHelp } from '@/shared/translation/failureHelp.js';
import { safeTranslationMetaForEnvelope } from '@/shared/translation/resolveProvider.js';
import {
  createIdentityStreakGuard,
  logIdentityStreakAbortNoWriteNotice,
} from '@/shared/translator/identity.js';
import { ISSUE_GENERATE_USAGE } from '@/constants/issueCodes.js';
import { printCommandSummary } from '@/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import { resolveFromCwd } from '@/utils/paths/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';

import { mergeGenerateOptionsFromEnv } from '@/commands/generate/env.js';
import {
  printGenerateSessionBanner,
  promptFullRetranslate,
  promptLanguageCodeOnly,
  promptMetaLocaleDetails,
} from '@/commands/generate/prompts.js';
import {
  printGenerateFinalizeSummary,
  printPreserveParityReport,
} from '@/commands/generate/summary/index.js';

import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { GenerateJsonPayload } from '@/types/command/generate/json.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope, Issue } from '@/types/core/json/envelope.js';

type Runtime = { emit?: RunEmitter; runId?: string };

/** CLI flavor of {@link GenerateHostHooks}: TTY prompts, identity guard, progress relay, logger policy. */
function buildHostHooks(ctx: Context, runtime: Runtime): GenerateHostHooks {
  const { emit, runId } = runtime;
  const emitProgress = (
    e: Omit<Extract<RunEvent, { type: 'run.progress.generate' }>, 'op' | 'runId' | 'at'>,
  ): void => {
    emitRunEvent(emit, { op: 'generate', runId, at: nowMs(), ...e });
  };

  return {
    emitProgress,
    emit,
    runId,

    createSession: () => createSessionProgress({ quiet: ctx.run.quiet, json: ctx.run.json }),

    createIdentityStreakGuard: (target, clock) =>
      createIdentityStreakGuard(ctx, 'generate', target, clock),

    buildTickProgressRelay: ({ tick, target, translationMeta }) =>
      createGenerateTickProgressRelay({ tick, emit, runId, target, translationMeta }),

    beforeProviderFallbackWarn: () => {
      up(ctx.run, rows.gap);
    },

    log: {
      info: (msg) => {
        if (canPrintInfo(ctx.run)) logger.info(msg, ctx.run);
      },
      // Warn-styled hint that should still hide under `--quiet` (info policy, not warn policy).
      notice: (msg) => {
        if (canPrintInfo(ctx.run)) logger.warn(msg, ctx.run);
      },
      warn: (msg) => {
        if (canPrintWarn(ctx.run)) logger.warn(msg, ctx.run);
      },
    },

    shouldSkipInteractivePrompts: () => getCliYesFlag(),
    canAskInteractive: () => canAsk(ctx.run),

    promptMetaLocaleDetails: (defaults) => promptMetaLocaleDetails(defaults, ctx.run),
    promptFullRetranslate,

    printSessionBanner: () => printGenerateSessionBanner(ctx.run),

    printPreserveParityReport: (preserve, parity) =>
      printPreserveParityReport(preserve, parity, ctx.run),

    printFinalizeSummary: (input) => printGenerateFinalizeSummary(input, ctx.run),

    onIdentityAbortNotice: (err, opts) =>
      logIdentityStreakAbortNoWriteNotice(ctx, err, {
        dryRun: opts.dryRun,
        commandDisplay: 'generate',
      }),
  };
}

function emptyGeneratePayload(ctx: Context, opts: GenerateOptions): GenerateJsonPayload {
  return {
    kind: 'generate',
    ...safeTranslationMetaForEnvelope(ctx, opts.provider),
    dryRun: Boolean(opts.dryRun),
    force: Boolean(opts.force),
    targets: [],
    dynamicKeySites: 0,
    leavesProcessed: 0,
    targetResults: [],
  };
}

/**
 * Discovery scan, source read, target resolution (CLI-only), then **`runGenerate`** in core.
 * Merges CLI-derived issues with core-emitted issues. Throws on USAGE / partial / unknown failures —
 * the caller decides whether that becomes a JSON envelope or a human error summary.
 */
async function executeCore(
  ctx: Context,
  merged: GenerateOptions,
  runtime: Runtime,
): Promise<{ payload: GenerateJsonPayload; issues: Issue[] }> {
  const { emit, runId } = runtime;
  const emitProgress = (
    e: Omit<Extract<RunEvent, { type: 'run.progress.generate' }>, 'op' | 'runId' | 'at'>,
  ): void => {
    emitRunEvent(emit, { op: 'generate', runId, at: nowMs(), ...e });
  };

  emitProgress({ type: 'run.progress.generate', phase: 'scan_dynamic_sites' });
  const dynamicSites = resolveLocalesDynamicSites(ctx);
  if (dynamicSites.length > 0 && canPrintWarn(ctx.run)) {
    logger.warn(
      `${String(dynamicSites.length)} translation call(s) use a non-literal key — generation follows source JSON paths only; computed keys are not enumerated here.`,
      ctx.run,
    );
  }

  const sourcePath = merged.source ? resolveFromCwd(merged.source) : ctx.paths.sourceLocale;
  emitProgress({ type: 'run.progress.generate', phase: 'read_source', label: sourcePath });
  const raw = readHostJsonUnknown(sourcePath, ctx.adapters.fs);

  const rawTarget = pickTargetSelector(merged.target);
  if (!rawTarget && !canAsk(ctx.run)) {
    throw new I18nPruneError(
      'generate requires --target when running non-interactively (--json or CI)',
      'USAGE',
    );
  }
  const targets = rawTarget
    ? parseLocaleCodesList(rawTarget)
    : [normalizeLanguageCode((await promptLanguageCodeOnly(ctx.run)).trim())];
  if (targets.length === 0) {
    throw new I18nPruneError('generate: no target locale codes provided', 'USAGE');
  }

  const coreCtx = createCoreContext({
    config: ctx.config,
    adapters: ctx.adapters,
    env: process.env,
    paths: ctx.paths,
    run: ctx.run,
  });

  const { payload, issues: coreIssues } = await runGenerate(
    coreCtx,
    {
      targets,
      dynamicKeySites: dynamicSites.length,
      source: merged.source,
      preloadedRaw: raw,
      provider: merged.provider,
      workers: merged.workers,
      englishName: merged.englishName,
      nativeName: merged.nativeName,
      direction: merged.direction,
      force: merged.force,
      dryRun: merged.dryRun,
      metadata: merged.metadata,
      noLocaleMeta: merged.noLocaleMeta,
    },
    buildHostHooks(ctx, runtime),
  );

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    coreIssues,
  );

  return { payload, issues };
}

/**
 * **`--json`** mode: build a {@link CliJsonEnvelope} from a successful run or convert a known failure
 * (USAGE / embedded issues / unknown) into a failure envelope. Never throws.
 */
async function buildJsonEnvelope(
  ctx: Context,
  merged: GenerateOptions,
  runtime: Runtime,
): Promise<CliJsonEnvelope<'generate', GenerateJsonPayload>> {
  emitRunEvent(runtime.emit, { type: 'run.started', op: 'generate', runId: runtime.runId, at: nowMs() });

  try {
    const { payload, issues } = await executeCore(ctx, merged, runtime);
    const envelope = buildCliJsonEnvelope('generate', payload, {
      ok: true,
      issues,
      cwd: process.cwd(),
    });
    emitRunEvent(runtime.emit, {
      type: 'run.completed',
      op: 'generate',
      runId: runtime.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime.emit, {
      type: 'run.summary',
      op: 'generate',
      runId: runtime.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: {
        targets: payload.targets.length,
        leaves: payload.leavesProcessed,
        dynamicKeySites: payload.dynamicKeySites,
      },
    });
    return envelope;
  } catch (err) {
    if (err instanceof I18nPruneError && err.code === 'USAGE') {
      const usageIssue = usageIssueFromI18nPruneError(err, ISSUE_GENERATE_USAGE);
      const envelope = buildCliJsonEnvelope('generate', emptyGeneratePayload(ctx, merged), {
        ok: false,
        issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), [usageIssue]),
        cwd: process.cwd(),
      });
      emitIssuesAsRunErrors(runtime.emit, {
        op: 'generate',
        runId: runtime.runId,
        issues: envelope.issues,
        recoverable: true,
      });
      emitRunEvent(runtime.emit, {
        type: 'run.completed',
        op: 'generate',
        runId: runtime.runId,
        at: nowMs(),
        ok: envelope.ok,
      });
      emitRunEvent(runtime.emit, {
        type: 'run.summary',
        op: 'generate',
        runId: runtime.runId,
        at: nowMs(),
        ok: envelope.ok,
        issueCount: envelope.issues.length,
        counts: { targets: 0, leaves: 0, dynamicKeySites: 0 },
      });
      return envelope;
    }
    if (err && typeof err === 'object' && 'issues' in err) {
      const embedded = (err as { issues?: Issue[] }).issues ?? [];
      if (embedded.length > 0) {
        emitIssuesAsRunErrors(runtime.emit, {
          op: 'generate',
          runId: runtime.runId,
          issues: embedded,
          recoverable: true,
        });
        const envelope = buildCliJsonEnvelope('generate', emptyGeneratePayload(ctx, merged), {
          ok: false,
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), embedded),
          cwd: process.cwd(),
        });
        emitRunEvent(runtime.emit, {
          type: 'run.completed',
          op: 'generate',
          runId: runtime.runId,
          at: nowMs(),
          ok: envelope.ok,
        });
        emitRunEvent(runtime.emit, {
          type: 'run.summary',
          op: 'generate',
          runId: runtime.runId,
          at: nowMs(),
          ok: envelope.ok,
          issueCount: envelope.issues.length,
          counts: { targets: 0, leaves: 0, dynamicKeySites: 0 },
        });
        return envelope;
      }
    }
    emitRunErrorFromUnknown(runtime.emit, {
      op: 'generate',
      runId: runtime.runId,
      err,
      code: 'i18nprune.run.generate_failed',
      recoverable: false,
    });
    emitRunEvent(runtime.emit, {
      type: 'run.failed',
      op: 'generate',
      runId: runtime.runId,
      at: nowMs(),
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      },
    });
    return buildIoReadFailureEnvelope('generate', emptyGeneratePayload(ctx, merged), ctx, err);
  }
}

/**
 * Public CLI command for **`i18nprune generate`**. Branches on **`--json`** vs human and renders the
 * appropriate output; both paths share **`executeCore`** so the CLI never duplicates orchestration.
 */
export async function generate(opts: GenerateOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const merged = mergeGenerateOptionsFromEnv(opts);
    const runId = String(Date.now());

    for (const w of ctx.meta.warnings) {
      logger.detail(w, ctx.run);
    }

    if (ctx.run.json) {
      const envelope = await buildJsonEnvelope(ctx, merged, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
        return;
      }
      const payload = envelope.data;
      if (!merged.dryRun) {
        const writtenTargets = payload.targetResults
          .filter((row) => row.status === 'written')
          .map((row) => row.target);
        await applyCommandPatching({
          ctx,
          command: 'generate',
          action: 'upsert_locales',
          localeCodes: writtenTargets,
        });
        refreshProjectReportCache(ctx);
      }
      return;
    }

    let payload: GenerateJsonPayload;
    let issues: Issue[];
    try {
      const result = await executeCore(ctx, merged, {});
      payload = result.payload;
      issues = result.issues;
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const embedded = (err as { issues?: Issue[] }).issues;
        if (embedded && embedded.length > 0) {
          logTranslateFailureHelp(ctx, 'generate', embedded);
          printCommandSummary(
            { command: 'generate', ok: false, durationMs: wall.elapsedMs(), issues: embedded },
            ctx,
          );
          process.exitCode = 1;
          return;
        }
      }
      throw err;
    }

    if (!merged.dryRun) {
      const writtenTargets = payload.targetResults
        .filter((row) => row.status === 'written')
        .map((row) => row.target);
      await applyCommandPatching({
        ctx,
        command: 'generate',
        action: 'upsert_locales',
        localeCodes: writtenTargets,
      });
      refreshProjectReportCache(ctx);
    }

    const needsReview = payload.targetResults.reduce((n, row) => n + (row.markedForReview ?? 0), 0);
    printCommandSummary(
      {
        command: 'generate',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: {
          locales: payload.targets.length,
          leaves: payload.leavesProcessed,
          needsReview,
          ...resolveExtractionBaselineCounts(ctx),
        },
        issues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
