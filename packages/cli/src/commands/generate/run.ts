/**
 * CLI entry: **`i18nprune generate`**. Single-file command shell.
 *
 * Owns: argv merge, context resolution, branching **`--json`** vs human, and post-success
 * patching / cache refresh. Hooks live in **`./hooks.ts`**, JSON envelope shaping +
 * shared core delegate (**`executeCore`**) live in **`./jsonEnvelope.ts`**.
 *
 * Anything orchestration-heavy (translate, fallback, identity, file IO) lives in
 * **`@i18nprune/core/generate`**'s **`runGenerate`** and is reused by SDK / extension /
 * web / worker hosts via the same **`GenerateHostHooks`** contract.
 */

import { stringifyEnvelope, buildCliJsonEnvelope, noopRunEmitter } from '@i18nprune/core';

import { invalidateProjectAnalysisCacheForContext, resolveExtractionBaselineCounts } from '@/shared/cache/index.js';
import { resolveContext } from '@/shared/context/index.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { logTranslateFailureHelp } from '@/shared/translator/failureHelp.js';
import { printCommandSummary } from '@/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { cliReadinessIssues } from '@/shared/project/index.js';

import { mergeGenerateOptionsFromEnv } from '@/commands/generate/env.js';
import { executeCore, runGenerateJsonEnvelope, emptyGeneratePayload } from '@/commands/generate/jsonEnvelope.js';

import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { GenerateJsonPayload } from '@i18nprune/core';
import type { Issue } from '@i18nprune/core';

/**
 * Public CLI command for **`i18nprune generate`**. Branches on **`--json`** vs human and renders the
 * appropriate output; both paths share **`executeCore`** (in **`./jsonEnvelope.ts`**) so the CLI
 * never duplicates orchestration.
 */
export async function generate(opts: GenerateOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const merged = mergeGenerateOptionsFromEnv(opts);
    const runId = String(Date.now());

    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'generate' });
    if (readiness) {
      if (ctx.run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope('generate', emptyGeneratePayload(ctx, merged), {
              ok: false,
              issues: readiness,
              cwd: ctx.adapters.system.cwd(),
            }),
          ),
        );
        applyCliCiExitGate(false);
        return;
      }
      if (readiness[0]) logger.warn(readiness[0].message, ctx.run);
      printCommandSummary(
        { command: 'generate', ok: false, durationMs: wall.elapsedMs(), issues: readiness },
        ctx,
      );
      applyCliCiExitGate(false);
      return;
    }

    for (const w of ctx.meta.warnings) {
      logger.detail(w, ctx.run);
    }

    if (ctx.run.json) {
      const envelope = await runGenerateJsonEnvelope(ctx, merged, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      applyCliCiExitGate(envelope.ok);
      if (!envelope.ok) {
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
        const writtenLocalePaths = payload.targetResults
          .filter((row) => row.status === 'written')
          .map((row) => row.paths?.localeJson)
          .filter((path): path is string => path !== undefined);
        invalidateProjectAnalysisCacheForContext(ctx, { writtenLocalePaths });
      }
      return;
    }

    let payload: GenerateJsonPayload;
    let issues: Issue[];
    try {
      const result = await executeCore(ctx, merged, { emit: createCliRunEmitter(ctx.run), runId });
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
          applyCliCiExitGate(false);
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
      const writtenLocalePaths = payload.targetResults
        .filter((row) => row.status === 'written')
        .map((row) => row.paths?.localeJson)
        .filter((path): path is string => path !== undefined);
      invalidateProjectAnalysisCacheForContext(ctx, { writtenLocalePaths });
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
