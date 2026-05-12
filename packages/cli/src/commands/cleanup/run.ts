import { confirm } from '@inquirer/prompts';
import { createCliCoreContext, resolveContext } from '@/shared/context/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import {
  createCleanupSourceWritePlan,
  emitCleanupAbortMessage,
  emitCleanupAskIgnoredMessage,
  emitCleanupWriteDone,
  emitCleanupWriteIntro,
  I18nPruneError,
  noopRunEmitter,
  stringifyEnvelope,
  writeCleanupPlan,
} from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { executeCore, runCleanupJsonEnvelope } from '@/commands/cleanup/jsonEnvelope.js';
import { canAsk, promptApprovedRemovalKeys } from '@/shared/ask/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import type { CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CleanupJsonOutput, CliJsonEnvelope, CoreContext } from '@i18nprune/core';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';

function createCleanupCoreContext(ctx: Awaited<ReturnType<typeof resolveContext>>): CoreContext {
  return createCliCoreContext(ctx);
}

export async function cleanup(opts: CleanupOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const runId = String(Date.now());

    if (ctx.run.json) {
      const { envelope } = runCleanupJsonEnvelope(ctx, opts, { emit: noopRunEmitter, runId });
      const durationMs = wall.elapsedMs();
      const d = envelope.data;
      const withSummary: CliJsonEnvelope<'cleanup', CleanupJsonOutput> = {
        ...envelope,
        data: {
          ...d,
          summary: {
            durationMs,
            command: 'cleanup',
            ok: envelope.ok,
            counts: { remove: d.wouldRemove, dynamicKeySites: d.dynamicKeySites },
          },
        },
      };
      console.log(stringifyEnvelope(withSummary));
      if (!envelope.ok) {
        process.exitCode = 1;
      }
      return;
    }

    const runtime = { emit: createCliRunEmitter(ctx.run), runId };
    const result = executeCore(ctx, opts, runtime);
    const summaryIssues = result.envelope.issues;
    const extractionBaseline = {
      dynamic: result.dynamicSites.length,
      keyObservations: result.keyObservationsCount,
    };

    if (opts.checkOnly || opts.dryRun) {
      printCommandSummary(
        {
          command: 'cleanup',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: { remove: result.safeToRemove.length, ...extractionBaseline },
          issues: summaryIssues,
        },
        ctx,
      );
      return;
    }

    let keysToRemove = result.safeToRemove;

    if (keysToRemove.length === 0) {
      printCommandSummary(
        {
          command: 'cleanup',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: { removedPaths: 0, filesWritten: 0, dynamicKeySites: result.dynamicSites.length },
          issues: summaryIssues,
        },
        ctx,
      );
      return;
    }

    if (!getCliYesFlag()) {
      let granularAskDone = false;
      if (opts.ask && canAsk(ctx.run)) {
        keysToRemove = await promptApprovedRemovalKeys(keysToRemove, {
          mode: opts.askPerKey ? 'each' : 'group',
          targetDisplay: ctx.paths.sourceLocale,
        });
        granularAskDone = true;
        if (keysToRemove.length === 0) {
          emitCleanupAbortMessage(runtime, 'no_keys_approved');
          printCommandSummary(
            {
              command: 'cleanup',
              ok: true,
              durationMs: wall.elapsedMs(),
              counts: extractionBaseline,
              notes: ['aborted: no keys approved'],
              issues: summaryIssues,
            },
            ctx,
          );
          return;
        }
      } else if (opts.ask && !canAsk(ctx.run)) {
        emitCleanupAskIgnoredMessage(runtime);
      }

      if (!granularAskDone && canAsk(ctx.run)) {
        const ok = await duringPrompt(() =>
          confirm({
            message: `Remove ${String(keysToRemove.length)} unused key path(s) from ${ctx.paths.sourceLocale}?`,
            default: false,
          }),
        );
        if (!ok) {
          emitCleanupAbortMessage(runtime, 'declined_confirmation');
          printCommandSummary(
            {
              command: 'cleanup',
              ok: true,
              durationMs: wall.elapsedMs(),
              counts: extractionBaseline,
              notes: ['aborted: user declined confirmation'],
              issues: summaryIssues,
            },
            ctx,
          );
          return;
        }
      } else if (!granularAskDone && !canAsk(ctx.run)) {
        throw new I18nPruneError(
          'cleanup: destructive run requires global --yes when non-interactive (or use --check-only / --dry-run)',
          'USAGE',
        );
      }
    }

    const coreCtx = createCleanupCoreContext(ctx);
    const plan =
      keysToRemove.length === result.writePlan.keys.length &&
      keysToRemove.every((key, idx) => key === result.writePlan.keys[idx])
        ? result.writePlan
        : createCleanupSourceWritePlan(coreCtx, keysToRemove);
    emitCleanupWriteIntro(runtime, plan.removedPaths.length);
    writeCleanupPlan(coreCtx, plan);
    const filesWritten = plan.removedPaths.length > 0 ? 1 : 0;
    emitCleanupWriteDone(runtime, { plan, wrote: filesWritten > 0 });

    printCommandSummary(
      {
        command: 'cleanup',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: {
          removedPaths: plan.removedPaths.length,
          filesWritten,
          ...extractionBaseline,
        },
        issues: summaryIssues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
