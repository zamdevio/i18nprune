/**
 * **`--json`** envelope wrappers for **`i18nprune generate`** plus the shared core-delegate
 * (**`executeCore`**) used by both **`--json`** and human paths.
 *
 * Mirrors the **`packages/cli/src/commands/<cmd>/jsonEnvelope.ts`** pattern (e.g. **`sync`**):
 * envelope shaping + run.* event emission live here so **`run.ts`** stays a thin entry shell.
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
  normalizeLanguageCode,
  nowMs,
  parseLocaleCodesList,
  pickTargetSelector,
  resolveReferenceConfig,
  resolveResumeAllTargetCodes,
  resolveResumeTargetCodesFromRaw,
  runGenerate as runCoreGenerate,
} from '@i18nprune/core';
import type { GenerateRunHooks } from '@i18nprune/core';
import type { RunEvent } from '@i18nprune/core';

import { canAsk } from '@/shared/ask/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { resolveLocalesDynamicSites } from '@/shared/cache/index.js';
import { readHostJsonUnknown } from '@/shared/io/hostJson.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
  usageIssueFromI18nPruneError,
} from '@/shared/result/cliEnvelopeIssues.js';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import { safeTranslationMetaForEnvelope } from '@/shared/translation/resolveProvider.js';
import { ISSUE_GENERATE_USAGE } from '@/constants/issueCodes.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintWarn } from '@/utils/logger/policy.js';
import { resolveFromCwd } from '@/utils/paths/index.js';

import { buildKeyReferenceContext } from '@/shared/reference/context.js';
import { buildGenerateHostHooks } from '@/commands/generate/hooks.js';
import type { GenerateRuntime } from '@/commands/generate/hooks.js';
import {
  promptGenerateIncompleteWrite,
  promptGenerateResumeLanguageSelection,
  promptLanguageCodeOnly,
  confirmGenerateResumeAsk,
} from '@/commands/generate/prompts.js';
import { promptGenerateHandoffPick } from '@/shared/translation/handoff.js';

import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { GenerateJsonPayload } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope, Issue } from '@/types/core/json/envelope.js';

/** Failure-envelope payload used when **`generate`** rejects before producing target results. */
export function emptyGeneratePayload(ctx: Context, opts: GenerateOptions): GenerateJsonPayload {
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
export async function executeCore(
  ctx: Context,
  merged: GenerateOptions,
  runtime: GenerateRuntime,
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

  const projectFs = { fs: ctx.adapters.fs, path: ctx.adapters.path };
  const sourceBase = ctx.adapters.path.basename(ctx.paths.sourceLocale, '.json');

  let resumeReference: import('@i18nprune/core').GenerateResumeRefContext | undefined;
  if (merged.resume) {
    const eff = resolveReferenceConfig('generate', ctx.config);
    const refCtx = buildKeyReferenceContext(ctx, eff);
    resumeReference = { uncertainPrefixes: refCtx.uncertainPrefixes };
  }

  let targets: string[];
  if (merged.resume) {
    if (merged.all) {
      targets = resolveResumeAllTargetCodes(projectFs, ctx.paths.localesDir, sourceBase, 'generate');
    } else {
      const rawTarget = pickTargetSelector(merged.target);
      if (!rawTarget) {
        if (!canAsk(ctx.run)) {
          throw new I18nPruneError(
            'generate --resume requires --target or --all when running non-interactively (--json or CI)',
            'USAGE',
          );
        }
        const picked = await promptGenerateResumeLanguageSelection(
          ctx.paths.localesDir,
          sourceBase,
          projectFs,
          ctx.run,
        );
        targets = resolveResumeTargetCodesFromRaw({
          commandName: 'generate',
          raw: picked,
          localesDir: ctx.paths.localesDir,
          sourceLocalePath: ctx.paths.sourceLocale,
          runtime: projectFs,
        });
      } else {
        targets = resolveResumeTargetCodesFromRaw({
          commandName: 'generate',
          raw: rawTarget,
          localesDir: ctx.paths.localesDir,
          sourceLocalePath: ctx.paths.sourceLocale,
          runtime: projectFs,
        });
      }
    }
    if (merged.ask === true && targets.length > 0 && canAsk(ctx.run) && !getCliYesFlag()) {
      const ok = await confirmGenerateResumeAsk(targets);
      if (!ok) {
        throw new I18nPruneError('generate --resume cancelled by user', 'USAGE');
      }
    }
  } else {
    const rawTarget = pickTargetSelector(merged.target);
    if (!rawTarget && !canAsk(ctx.run)) {
      throw new I18nPruneError(
        'generate requires --target when running non-interactively (--json or CI)',
        'USAGE',
      );
    }
    targets = rawTarget
      ? parseLocaleCodesList(rawTarget)
      : [normalizeLanguageCode((await promptLanguageCodeOnly(ctx.run)).trim())];
  }
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

  const generateHooks: GenerateRunHooks = {
    onHandoffPick: (offer) => promptGenerateHandoffPick(offer, ctx.run),
    onIncomplete: async (info) => {
      if (!canAsk(ctx.run) || getCliYesFlag()) {
        return { action: 'write_partial' };
      }
      const ok = await promptGenerateIncompleteWrite(info, ctx.run);
      return { action: ok ? 'write_partial' : 'abort_no_write' };
    },
  };

  const { payload, issues: coreIssues } = await runCoreGenerate(
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
      ask: merged.ask,
      resume: merged.resume === true ? true : undefined,
      resumeReference,
    },
    buildGenerateHostHooks(ctx, runtime),
    generateHooks,
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
export async function runGenerateJsonEnvelope(
  ctx: Context,
  merged: GenerateOptions,
  runtime: GenerateRuntime,
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
