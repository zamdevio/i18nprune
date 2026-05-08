import { resolveContext } from '@/shared/context/index.js';
import { executeGenerate } from '@/commands/generate/execute.js';
import { runGenerate } from '@/commands/generate/runGenerate.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import { mergeGenerateOptionsFromEnv } from '@/commands/generate/env.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import { logger } from '@/utils/logger/index.js';
import { noopRunEmitter } from '@i18nprune/core';
import { refreshProjectReportCache } from '@/shared/cache/index.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { logTranslateFailureHelp } from '@/shared/translation/failureHelp.js';
import { attachWallTimer } from '@/utils/timer/index.js';

async function resolveGenerateData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
  merged: ReturnType<typeof mergeGenerateOptionsFromEnv>,
  runId: string,
): Promise<{
  mode: 'json' | 'human';
  envelope?: Awaited<ReturnType<typeof runGenerate>>;
  payload?: Awaited<ReturnType<typeof executeGenerate>>['payload'];
  issues?: Awaited<ReturnType<typeof executeGenerate>>['issues'];
}> {
  if (ctx.run.json) {
    return { mode: 'json', envelope: await runGenerate(ctx, merged, { emit: noopRunEmitter, runId }) };
  }
  const out = await executeGenerate(ctx, merged);
  return { mode: 'human', payload: out.payload, issues: out.issues };
}

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
      const resolved = await resolveGenerateData(ctx, merged, runId);
      const envelope =
        resolved.mode === 'json' ? resolved.envelope! : await runGenerate(ctx, merged, { emit: noopRunEmitter, runId });
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

    let payload: Awaited<ReturnType<typeof executeGenerate>>['payload'];
    let issues: Awaited<ReturnType<typeof executeGenerate>>['issues'];
    try {
      const resolved = await resolveGenerateData(ctx, merged, runId);
      payload = resolved.payload!;
      issues = resolved.issues!;
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const embedded = (err as { issues?: Issue[] }).issues;
        if (embedded && embedded.length > 0) {
          logTranslateFailureHelp(ctx, 'generate', embedded);
          printCommandSummary(
            {
              command: 'generate',
              ok: false,
              durationMs: wall.elapsedMs(),
              issues: embedded,
            },
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
          dynamicKeySites: payload.dynamicKeySites,
          needsReview,
        },
        issues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
