import { resolveContext } from '@/shared/context/index.js';
import { runSync } from '@/commands/sync/jsonEnvelope.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import { printSyncHumanSummary } from '@/commands/sync/summary.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromSyncMissingLocaleFiles,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDetail, canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import type { LocaleMetadataReport } from '@/types/core/localeLeaves/index.js';
import { noopRunEmitter } from '@i18nprune/core';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import type { SyncJsonOutput } from '@/types/command/sync/json.js';
import type { SyncOptions } from '@/types/command/sync/index.js';
import { refreshProjectReportCache } from '@/shared/cache/index.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { attachWallTimer } from '@/utils/timer/index.js';

function syncLocaleMetadataDetailLine(
  report: LocaleMetadataReport | undefined,
  explicitStrip: boolean,
  explicitMetadata: boolean,
): string | undefined {
  if ((!explicitStrip && !explicitMetadata) || !report) return undefined;
  if (explicitStrip) {
    return report.strippedStructuredLeaves > 0
      ? `metadata · stripped structured fields at ${String(report.strippedStructuredLeaves)} template leaf path(s) (plain strings)`
      : `metadata · no structured leaves stripped (already plain strings at template paths)`;
  }
  const parts: string[] = [];
  const mat = report.byReason.canonical_metadata_materialized ?? 0;
  if (report.promotedLegacyLeaves > 0) parts.push(`${String(report.promotedLegacyLeaves)} plain → structured`);
  if (mat > 0) parts.push(`${String(mat)} thin leaf(es) gained full canonical metadata keys`);
  if (report.repairedCorruptLeaves > 0) parts.push(`${String(report.repairedCorruptLeaves)} corrupt repaired`);
  if (report.missingPathsHydratedFromSource > 0) {
    parts.push(`${String(report.missingPathsHydratedFromSource)} missing hydrated from source`);
  }
  if (parts.length > 0) return `metadata · ${parts.join(' · ')}`;
  return `metadata · structured terminals unchanged (validated in place)`;
}

function resolveSyncData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
  opts: SyncOptions,
  runId: string,
): ReturnType<typeof runSync> {
  // Pattern hook: can become cache-backed later without changing command flow.
  return runSync(ctx, opts, { emit: noopRunEmitter, runId });
}

export async function sync(opts: SyncOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const runId = String(Date.now());

    if (ctx.run.json) {
      try {
        const {
          envelope,
          fileLines,
          targets: _targets,
          updated,
          dynamicSites: _dynamicSites,
          missingLocaleCodes,
        } = resolveSyncData(ctx, opts, runId);
        if (missingLocaleCodes.length > 0 && canPrintDetail(ctx.run)) {
          logger.warn(
            `locale file(s) not found (skipped): ${missingLocaleCodes.map((m) => `${m}.json`).join(', ')}`,
            ctx.run,
          );
        }
        console.log(stringifyEnvelope(envelope));
        if (!envelope.ok) {
          process.exitCode = 1;
        }
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
      }
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
    } = resolveSyncData(ctx, opts, runId);
    const explicitStripMetadata = opts.stripMetadata === true;
    const explicitMetadata = opts.metadata === true;

    if (missingLocaleCodes.length > 0 && canPrintDetail(ctx.run)) {
      logger.warn(
        `locale file(s) not found (skipped): ${missingLocaleCodes.map((m) => `${m}.json`).join(', ')}`,
        ctx.run,
      );
    }

    if (dynamicSites.length > 0 && canPrintWarn(ctx.run)) {
      logger.warn(
        `${String(dynamicSites.length)} translation call(s) use a non-literal key — sync only aligns locale JSON shapes; computed keys from code are not merged or enumerated.`,
        ctx.run,
      );
    }
    const summaryListWindow = resolveCliListWindow(ctx.config, { defaultTop: 14 });
    const summaryIssues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDynamicScanCount(dynamicSites.length),
      issuesFromSyncMissingLocaleFiles(missingLocaleCodes),
    );

    printSyncHumanSummary(
      {
        files: fileLines,
        dynamicSiteCount: dynamicSites.length,
        dryRun: Boolean(opts.dryRun),
        listLimit: summaryListWindow.limit,
      },
      ctx.run,
    );
    if (dynamicSites.length > 0 && canPrintInfo(ctx.run)) {
      logger.info(
        'Dynamic keys are not merged by sync — see `i18nprune validate` and `i18nprune locales dynamic`.',
        ctx.run,
      );
    }
    if (canPrintInfo(ctx.run)) {
      const reports = envelope.data.localeMetadataReports;
      for (const file of targets) {
        const s = humanLeafSummaryByLocaleFile[file];
        if (!s) continue;
        logger.info(
          `${file}: ${String(s.hydratedFromSource)} leaf path(s) filled from source · ${String(s.preservedExistingLeaves)} kept · ${String(s.prunedExtraLeaves)} extra path(s) removed (not in source)`,
          ctx.run,
        );
        const metaLine = syncLocaleMetadataDetailLine(reports?.[file], explicitStripMetadata, explicitMetadata);
        if (metaLine !== undefined && canPrintDetail(ctx.run)) logger.detail(`  ● ${metaLine}`, ctx.run);
      }
    }
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
        counts: { files: targets.length, written: updated, dynamic: dynamicSites.length },
        issues: summaryIssues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
