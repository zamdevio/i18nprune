import { resolveContext } from '@/core/context/index.js';
import { runSync } from '@/core/sync/jsonEnvelope.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import { printSyncHumanSummary } from '@/commands/sync/summary.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromSyncMissingLocaleFiles,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDetail } from '@/utils/logger/policy.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { SyncJsonOutput } from '@/types/command/sync/json.js';
import type { SyncOptions } from '@/types/command/sync/index.js';

export async function sync(opts: SyncOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();

  if (ctx.run.json) {
    try {
      const { envelope, targets, updated, dynamicSites, missingLocaleCodes } = runSync(ctx, opts);
      if (missingLocaleCodes.length > 0 && canPrintDetail(ctx.run)) {
        logger.warn(
          `sync: locale file(s) not found (skipped): ${missingLocaleCodes.map((m) => `${m}.json`).join(', ')}`,
          ctx.run,
        );
      }
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
      }
      pushReportEntry({
        level: envelope.ok ? 'info' : 'error',
        command: 'sync',
        message: envelope.ok ? 'sync completed' : 'sync failed',
        data: {
          targets: targets.length,
          written: updated,
          dynamicSites: dynamicSites.length,
          dryRun: Boolean(opts.dryRun),
        },
      });
      await finalizeReportFile(ctx.config, {
        command: 'sync',
        ok: envelope.ok,
        durationMs: Date.now() - started,
        counts: { files: targets.length, written: updated, dynamic: dynamicSites.length },
      });
    } catch (err) {
      const empty: SyncJsonOutput = {
        kind: 'sync',
        sourcePath: ctx.paths.sourceLocale,
        localesDir: ctx.paths.localesDir,
        targetFiles: 0,
        writtenFiles: 0,
        dynamicKeySites: 0,
        dryRun: Boolean(opts.dryRun),
        files: [],
      };
      const envelope = buildIoReadFailureEnvelope('sync', empty, ctx, err);
      console.log(stringifyEnvelope(envelope));
      process.exitCode = 1;
      await finalizeReportFile(ctx.config, {
        command: 'sync',
        ok: false,
        durationMs: Date.now() - started,
        counts: {},
      });
    }
    return;
  }

  const { fileLines, targets, updated, dynamicSites, missingLocaleCodes } = runSync(ctx, opts);

  if (missingLocaleCodes.length > 0 && canPrintDetail(ctx.run)) {
    logger.warn(
      `sync: locale file(s) not found (skipped): ${missingLocaleCodes.map((m) => `${m}.json`).join(', ')}`,
      ctx.run,
    );
  }

  if (dynamicSites.length > 0) {
    logger.warn(
      `${String(dynamicSites.length)} translation call(s) use a non-literal key — sync only aligns JSON shapes; dynamic keys are not enumerated.`,
    );
  }

  const durationMs = Date.now() - started;
  const summaryIssues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    issuesFromSyncMissingLocaleFiles(missingLocaleCodes),
  );

  printCommandSummary(
    {
      command: 'sync',
      ok: true,
      durationMs,
      counts: { files: targets.length, written: updated, dynamic: dynamicSites.length },
      issues: summaryIssues,
    },
    ctx,
  );

  printSyncHumanSummary(
    {
      sourcePath: ctx.paths.sourceLocale,
      localesDir: ctx.paths.localesDir,
      files: fileLines,
      dynamicSiteCount: dynamicSites.length,
      dryRun: Boolean(opts.dryRun),
      durationMs,
    },
    ctx.run,
  );

  pushReportEntry({
    level: 'info',
    command: 'sync',
    message: 'sync completed',
    data: {
      targets: targets.length,
      written: updated,
      dynamicSites: dynamicSites.length,
      dryRun: Boolean(opts.dryRun),
    },
  });
  await finalizeReportFile(ctx.config, {
    command: 'sync',
    ok: true,
    durationMs,
    counts: { files: targets.length, written: updated, dynamic: dynamicSites.length },
  });
}
