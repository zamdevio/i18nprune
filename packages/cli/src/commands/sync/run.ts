import { resolveContext } from '@/shared/context/index.js';
import { executeCore, runSyncJsonEnvelope, emptySyncPayload } from '@/commands/sync/jsonEnvelope.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope, buildCliJsonEnvelope } from '@i18nprune/core';
import { emitSyncHumanMessages, noopRunEmitter } from '@i18nprune/core';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import type { SyncOptions } from '@/types/command/sync/index.js';
import { invalidateProjectAnalysisCacheForContext } from '@/shared/cache/index.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import type { SyncRuntime } from '@/types/command/sync/index.js';

function resolveSyncData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
  opts: SyncOptions,
  runtime: SyncRuntime,
): ReturnType<typeof executeCore> {
  return executeCore(ctx, opts, runtime);
}

export async function sync(opts: SyncOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const runId = String(Date.now());

    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'sync' });
    if (readiness) {
      if (ctx.run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope('sync', emptySyncPayload(ctx, opts), {
              ok: false,
              issues: readiness,
              cwd: ctx.adapters.system.cwd(),
            }),
          ),
        );
        applyCliCiExitGate(false);
        return;
      }
      printCommandSummary(
        {
          command: 'sync',
          ok: false,
          durationMs: wall.elapsedMs(),
          counts: { files: 0, dynamic: 0, keyObservations: 0, written: 0 },
          issues: readiness,
        },
        ctx,
      );
      applyCliCiExitGate(false);
      return;
    }

    if (ctx.run.json) {
      const { envelope, result } = runSyncJsonEnvelope(ctx, opts, { emit: noopRunEmitter, runId });
      if (result) {
        const { fileLines, updated } = result;
        if (!opts.dryRun && updated > 0) {
          const changedLocaleCodes = fileLines
            .filter((row) => row.changed)
            .map((row) => ctx.adapters.path.basename(row.path, '.json'));
          await applyCommandPatching({
            ctx,
            command: 'sync',
            action: 'upsert_locales',
            localeCodes: changedLocaleCodes,
          });
          const writtenLocalePaths = fileLines.filter((row) => row.changed).map((row) => row.path);
          invalidateProjectAnalysisCacheForContext(ctx, { writtenLocalePaths });
        }
      }
      console.log(stringifyEnvelope(envelope));
      applyCliCiExitGate(envelope.ok);
      return;
    }

    const summaryListWindow = resolveCliListWindow(ctx.config);
    const humanSummaryLocaleLimit = summaryListWindow.full ? undefined : summaryListWindow.limit;
    const {
      fileLines,
      targets,
      updated,
      dynamicSites,
      keyObservationsCount,
      missingLocaleCodes,
      envelope,
      humanLeafSummaryByLocaleFile,
      sourcePlaceholderLeaves,
      targetPlaceholderLeaves,
    } = resolveSyncData(ctx, opts, {
      emit: createCliRunEmitter(ctx.run),
      runId,
      humanSummaryLocaleLimit,
    });
    const explicitStripMetadata = opts.stripMetadata === true;
    const explicitMetadata = opts.metadata === true;
    const summaryIssues = envelope.issues;

    emitSyncHumanMessages(
      { emit: createCliRunEmitter(ctx.run), runId },
      {
        result: {
          payload: envelope.data,
          issues: envelope.issues,
          fileLines,
          targets,
          updated,
          dynamicSites,
          keyObservationsCount,
          missingLocaleCodes,
          humanLeafSummaryByLocaleFile,
          sourcePlaceholderLeaves,
          targetPlaceholderLeaves,
        },
        dryRun: Boolean(opts.dryRun),
        listLimit: summaryListWindow.limit,
        explicitStripMetadata,
        explicitMetadata,
      },
    );
    if (!opts.dryRun && updated > 0) {
      const changedLocaleCodes = fileLines
        .filter((row) => row.changed)
        .map((row) => ctx.adapters.path.basename(row.path, '.json'));
      await applyCommandPatching({
        ctx,
        command: 'sync',
        action: 'upsert_locales',
        localeCodes: changedLocaleCodes,
      });
      const writtenLocalePaths = fileLines.filter((row) => row.changed).map((row) => row.path);
      invalidateProjectAnalysisCacheForContext(ctx, { writtenLocalePaths });
    }

    printCommandSummary(
      {
        command: 'sync',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: {
          files: targets.length,
          written: updated,
          dynamic: dynamicSites.length,
          keyObservations: keyObservationsCount,
        },
        issues: summaryIssues,
      },
      ctx,
    );
    applyCliCiExitGate(envelope.ok);
  } finally {
    wall.dispose();
  }
}
