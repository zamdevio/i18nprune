import { confirm } from '@inquirer/prompts';
import { createCliCoreContext, resolveContext } from '@/shared/context/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import {
  buildCliJsonEnvelope,
  createCleanupLocaleWritePlan,
  emitCleanupAbortMessage,
  emitCleanupAskIgnoredMessage,
  emitCleanupWriteDone,
  emitCleanupWriteIntro,
  I18nPruneError,
  noopRunEmitter,
  stringifyEnvelope,
  writeCleanupPlan,
} from '@i18nprune/core';
import type { CleanupLocaleSlice } from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { emitCleanupCliModeNotices } from '@/commands/cleanup/hooks.js';
import { executeCore, runCleanupJsonEnvelope, emptyCleanupPayload } from '@/commands/cleanup/jsonEnvelope.js';
import { canAsk, promptApprovedRemovalKeys } from '@/shared/ask/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import type { CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CleanupJsonOutput, CleanupWritePlan, CliJsonEnvelope, CoreContext } from '@i18nprune/core';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { logger } from '@/utils/logger/index.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { formatLocaleSegmentFilesLabel } from '@/shared/locales/segmentLabel.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import type { Context } from '@/types/core/context/index.js';

function createCleanupCoreContext(ctx: Awaited<ReturnType<typeof resolveContext>>): CoreContext {
  return createCliCoreContext(ctx);
}

function cleanupSliceTargetDisplay(ctx: Context, slice: CleanupLocaleSlice): string {
  if (slice.segmentPaths.length === 0) {
    return slice.isTargetMode ? `${slice.localeCode} locale` : ctx.paths.sourceLocale;
  }
  if (slice.segmentPaths.length === 1) {
    return slice.segmentPaths[0]!;
  }
  return formatLocaleSegmentFilesLabel(slice.localeCode, slice.segmentPaths);
}

function localeLabelForWrite(slice: CleanupLocaleSlice): string {
  return slice.isTargetMode ? `target locale (${slice.localeCode})` : `source locale (${slice.localeCode})`;
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
              counts: {
                remove: d.wouldRemove,
                dynamic: d.dynamicActive,
                ...(d.dynamicCommented > 0 ? { commented: d.dynamicCommented } : {}),
              },
            },
          },
        };
        console.log(stringifyEnvelope(withSummary));
        applyCliCiExitGate(false);
        return;
      }
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
            counts: {
              remove: d.wouldRemove,
              dynamic: d.dynamicActive,
              ...(d.dynamicCommented > 0 ? { commented: d.dynamicCommented } : {}),
            },
          },
        },
      };
      console.log(stringifyEnvelope(withSummary));
      applyCliCiExitGate(envelope.ok);
      return;
    }

    emitCleanupCliModeNotices(ctx, opts);

    const listWindow = resolveCliListWindow(ctx.config);
    const runtime = {
      emit: createCliRunEmitter(ctx.run),
      runId,
      listLimit: listWindow.limit,
      listFull: listWindow.full,
    };
    const result = executeCore(ctx, opts, runtime);
    const summaryIssues = result.envelope.issues;
    const split = {
      total: result.dynamic.length,
      active: result.payload.dynamicActive,
      commented: result.payload.dynamicCommented,
    };
    const extractionBaseline = {
      dynamic: split.active,
      ...(split.commented > 0 ? { commented: split.commented } : {}),
      keyObservations: result.keyObservationsCount,
    };

    const slicesWithRemovals = result.localeSlices.filter((slice) => slice.safeToRemove.length > 0);

    if (opts.dryRun) {
      if (slicesWithRemovals.length > 0) {
        for (const slice of slicesWithRemovals) {
          const prefix = result.isMultiTarget ? `(${slice.localeCode}) ` : '';
          logger.info(
            `${prefix}dry-run: would remove ${String(slice.safeToRemove.length)} path(s) from ${cleanupSliceTargetDisplay(ctx, slice)}`,
            ctx.run,
          );
        }
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
            ...(result.isMultiTarget ? { targets: result.targetLocaleCodes.length } : {}),
            ...(result.skippedTargets.length > 0
              ? { skippedTargets: result.skippedTargets.length }
              : {}),
            dynamic: extractionBaseline.dynamic,
            keyObservations: extractionBaseline.keyObservations,
          },
          issues: summaryIssues,
        },
        ctx,
      );
      applyCliCiExitGate(result.envelope.ok);
      return;
    }

    if (slicesWithRemovals.length === 0) {
      printCommandSummary(
        {
          command: 'cleanup',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: {
            removedPaths: 0,
            filesWritten: 0,
            ...(result.isMultiTarget ? { targets: result.targetLocaleCodes.length } : {}),
            ...(result.skippedTargets.length > 0
              ? { skippedTargets: result.skippedTargets.length }
              : {}),
            dynamic: split.active,
            ...(split.commented > 0 ? { commented: split.commented } : {}),
          },
          issues: summaryIssues,
        },
        ctx,
      );
      applyCliCiExitGate(result.envelope.ok);
      return;
    }

    if (!getCliYesFlag()) {
      const wantsInteractiveApproval = opts.ask === true || opts.askPerKey === true;
      if (wantsInteractiveApproval && !canAsk(ctx.run)) {
        emitCleanupAskIgnoredMessage(runtime);
      }
    }

    const coreCtx = createCleanupCoreContext(ctx);
    let totalRemovedPaths = 0;
    let totalFilesWritten = 0;
    let declinedTargets = 0;
    let aborted = false;
    const writtenPlans: CleanupWritePlan[] = [];

    for (const slice of slicesWithRemovals) {
      let keysToRemove = slice.safeToRemove;

      if (!getCliYesFlag()) {
        const wantsInteractiveApproval = opts.ask === true || opts.askPerKey === true;
        if (wantsInteractiveApproval && canAsk(ctx.run)) {
          keysToRemove = await promptApprovedRemovalKeys(keysToRemove, {
            mode: opts.askPerKey ? 'each' : 'group',
            targetDisplay: cleanupSliceTargetDisplay(ctx, slice),
          });
          if (keysToRemove.length === 0) {
            declinedTargets += 1;
            continue;
          }
        } else if (canAsk(ctx.run)) {
          const ok = await duringPrompt(() =>
            confirm({
              message: `Remove ${String(keysToRemove.length)} unused key path(s) from ${cleanupSliceTargetDisplay(ctx, slice)}?`,
              default: false,
            }),
          );
          if (!ok) {
            declinedTargets += 1;
            continue;
          }
        } else {
          throw new I18nPruneError(
            'cleanup: destructive run requires global --yes when non-interactive (or use --dry-run / --json for report-only)',
            'USAGE',
          );
        }
      }

      const plan =
        keysToRemove.length === slice.writePlan.keys.length &&
        keysToRemove.every((key, idx) => key === slice.writePlan.keys[idx])
          ? slice.writePlan
          : createCleanupLocaleWritePlan(coreCtx, slice.localeCode, keysToRemove);

      emitCleanupWriteIntro(runtime, {
        removeCount: plan.removedPaths.length,
        segmentFileCount: plan.writes.length,
        localeLabel: localeLabelForWrite(slice),
        isTargetMode: slice.isTargetMode,
      });
      writeCleanupPlan(coreCtx, plan);
      writtenPlans.push(plan);
      totalRemovedPaths += plan.removedPaths.length;
      totalFilesWritten += plan.writes.length;
    }

    if (totalFilesWritten === 0 && declinedTargets > 0) {
      emitCleanupAbortMessage(runtime, 'declined_confirmation');
      aborted = true;
    }

    if (totalFilesWritten > 0) {
      const writes = writtenPlans.flatMap((plan) => plan.writes);
      emitCleanupWriteDone(runtime, {
        plan: {
          ...result.writePlan,
          writes,
          removedPaths: writes.flatMap((write) => write.removedPaths),
          keys: writtenPlans.flatMap((plan) => plan.keys),
          sourcePath: writes[0]?.sourcePath ?? result.writePlan.sourcePath,
          nextSourceJson: writes[0]?.nextSourceJson ?? result.writePlan.nextSourceJson,
        },
        wrote: true,
      });
    }

    printCommandSummary(
      {
        command: 'cleanup',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: {
          removedPaths: totalRemovedPaths,
          filesWritten: totalFilesWritten,
          ...(result.isMultiTarget ? { targets: result.targetLocaleCodes.length } : {}),
          ...(result.skippedTargets.length > 0
            ? { skippedTargets: result.skippedTargets.length }
            : {}),
          ...(declinedTargets > 0 ? { declinedTargets } : {}),
          ...extractionBaseline,
        },
        notes:
          declinedTargets > 0
            ? [`skipped ${String(declinedTargets)} target(s): user declined confirmation`]
            : aborted
              ? ['no locale files updated']
              : undefined,
        issues: summaryIssues,
      },
      ctx,
    );
    applyCliCiExitGate(result.envelope.ok);
  } finally {
    wall.dispose();
  }
}
