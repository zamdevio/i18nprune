import { confirm } from '@inquirer/prompts';
import { createCliCoreContext, resolveContext } from '@/shared/context/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import {
  buildCliJsonEnvelope,
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
import { emitCleanupCliModeNotices } from '@/commands/cleanup/hooks.js';
import { executeCore, runCleanupJsonEnvelope, emptyCleanupPayload } from '@/commands/cleanup/jsonEnvelope.js';
import { canAsk, promptApprovedRemovalKeys } from '@/shared/ask/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import type { CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CleanupJsonOutput, CliJsonEnvelope, CoreContext } from '@i18nprune/core';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { logger } from '@/utils/logger/index.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { formatLocaleSegmentFilesLabel } from '@/shared/locales/segmentLabel.js';
import { listCleanupSourceSegmentsForKeys, sourceLocaleCodeFromContext } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';

function createCleanupCoreContext(ctx: Awaited<ReturnType<typeof resolveContext>>): CoreContext {
  return createCliCoreContext(ctx);
}

function cleanupSourceTargetDisplay(ctx: Context, keys: readonly string[]): string {
  const coreCtx = createCliCoreContext(ctx);
  const sourceCode = sourceLocaleCodeFromContext(coreCtx);
  const segments = listCleanupSourceSegmentsForKeys(coreCtx, keys);
  if (segments.length === 0) {
    return ctx.paths.sourceLocale;
  }
  if (segments.length === 1) {
    return segments[0]!.relativePath;
  }
  return formatLocaleSegmentFilesLabel(
    sourceCode,
    segments.map((s) => s.relativePath),
  );
}

export async function cleanup(opts: CleanupOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const runId = String(Date.now());

    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'cleanup' });
    if (readiness) {
      if (ctx.run.json) {
        const envelope = buildCliJsonEnvelope('cleanup', emptyCleanupPayload(), {
          ok: false,
          issues: readiness,
          cwd: ctx.adapters.system.cwd(),
        });
        const durationMs = wall.elapsedMs();
        const d = envelope.data;
        const withSummary: CliJsonEnvelope<'cleanup', CleanupJsonOutput> = {
          ...envelope,
          data: {
            ...d,
            summary: {
              durationMs,
              command: 'cleanup',
              ok: false,
              counts: { remove: d.wouldRemove, dynamicKeySites: d.dynamicKeySites },
            },
          },
        };
        console.log(stringifyEnvelope(withSummary));
        applyCliCiExitGate(false);
        return;
      }
      if (readiness[0]) logger.warn(readiness[0].message, ctx.run);
      printCommandSummary(
        {
          command: 'cleanup',
          ok: false,
          durationMs: wall.elapsedMs(),
          counts: { remove: 0, dynamic: 0, keyObservations: 0 },
          issues: readiness,
        },
        ctx,
      );
      applyCliCiExitGate(false);
      return;
    }

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
      applyCliCiExitGate(envelope.ok);
      return;
    }

    emitCleanupCliModeNotices(ctx, opts);

    const runtime = { emit: createCliRunEmitter(ctx.run), runId };
    const result = executeCore(ctx, opts, runtime);
    const summaryIssues = result.envelope.issues;
    const extractionBaseline = {
      dynamic: result.dynamicSites.length,
      keyObservations: result.keyObservationsCount,
    };

    if (opts.dryRun) {
      if (result.safeToRemove.length > 0) {
        logger.info(
          `dry-run: would remove ${String(result.safeToRemove.length)} path(s) from ${cleanupSourceTargetDisplay(ctx, result.safeToRemove)}`,
          ctx.run,
        );
      } else {
        logger.info('dry-run: nothing to remove', ctx.run);
      }
      printCommandSummary(
        {
          command: 'cleanup',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: {
            removedPaths: 0,
            filesWritten: 0,
            dynamicKeySites: extractionBaseline.dynamic,
            keyObservations: extractionBaseline.keyObservations,
          },
          issues: summaryIssues,
        },
        ctx,
      );
      applyCliCiExitGate(result.envelope.ok);
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
      applyCliCiExitGate(result.envelope.ok);
      return;
    }

    if (!getCliYesFlag()) {
      const wantsInteractiveApproval = opts.ask === true || opts.askPerKey === true;
      let interactiveApprovalDone = false;
      if (wantsInteractiveApproval && canAsk(ctx.run)) {
        keysToRemove = await promptApprovedRemovalKeys(keysToRemove, {
          mode: opts.askPerKey ? 'each' : 'group',
          targetDisplay: cleanupSourceTargetDisplay(ctx, keysToRemove),
        });
        interactiveApprovalDone = true;
        if (keysToRemove.length === 0) {
          emitCleanupAbortMessage(runtime, 'no_keys_approved');
          printCommandSummary(
            {
              command: 'cleanup',
              ok: true,
              durationMs: wall.elapsedMs(),
              counts: extractionBaseline,
              issues: summaryIssues,
            },
            ctx,
          );
          applyCliCiExitGate(result.envelope.ok);
          return;
        }
      } else if (wantsInteractiveApproval && !canAsk(ctx.run)) {
        emitCleanupAskIgnoredMessage(runtime);
      }

      if (!interactiveApprovalDone && canAsk(ctx.run)) {
        const ok = await duringPrompt(() =>
          confirm({
            message: `Remove ${String(keysToRemove.length)} unused key path(s) from ${cleanupSourceTargetDisplay(ctx, keysToRemove)}?`,
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
              issues: summaryIssues,
            },
            ctx,
          );
          applyCliCiExitGate(result.envelope.ok);
          return;
        }
      } else if (!interactiveApprovalDone && !canAsk(ctx.run)) {
        throw new I18nPruneError(
          'cleanup: destructive run requires global --yes when non-interactive (or use --dry-run / --json for report-only)',
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
    emitCleanupWriteIntro(runtime, {
      removeCount: plan.removedPaths.length,
      segmentFileCount: plan.writes.length,
    });
    writeCleanupPlan(coreCtx, plan);
    const filesWritten = plan.writes.length;
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
    applyCliCiExitGate(result.envelope.ok);
  } finally {
    wall.dispose();
  }
}
