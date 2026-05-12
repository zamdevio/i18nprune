import { resolveContext } from '@/shared/context/index.js';
import { executeCore, runSyncJsonEnvelope } from '@/commands/sync/jsonEnvelope.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromSyncMissingLocaleFiles,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { emitSyncHumanMessages, noopRunEmitter } from '@i18nprune/core';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import type { SyncOptions } from '@/types/command/sync/index.js';
import { refreshProjectReportCache, resolveExtractionBaselineCounts } from '@/shared/cache/index.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
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
          refreshProjectReportCache(ctx);
        }
      }
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) process.exitCode = 1;
      return;
    }

    const {
      fileLines,
      targets,
      updated,
      dynamicSites,
      missingLocaleCodes,
      envelope,
      humanLeafSummaryByLocaleFile,
    } = resolveSyncData(ctx, opts, { emit: createCliRunEmitter(ctx.run), runId });
    const explicitStripMetadata = opts.stripMetadata === true;
    const explicitMetadata = opts.metadata === true;

    const summaryListWindow = resolveCliListWindow(ctx.config, { defaultTop: 14 });
    const summaryIssues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDynamicScanCount(dynamicSites.length),
      issuesFromSyncMissingLocaleFiles(missingLocaleCodes),
    );

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
          missingLocaleCodes,
          humanLeafSummaryByLocaleFile,
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
      refreshProjectReportCache(ctx);
    }

    printCommandSummary(
      {
        command: 'sync',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: { files: targets.length, written: updated, ...resolveExtractionBaselineCounts(ctx) },
        issues: summaryIssues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
