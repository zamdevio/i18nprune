import path from 'node:path';
import { collectStringLeaves } from '@i18nprune/core';
import { applyLocaleLeafMode, resolveLocaleLeafMode } from '@i18nprune/core';
import { computeSyncedLocaleJson } from '@i18nprune/core';
import { summarizeSyncLeavesForHumanLog } from '@i18nprune/core';
import { buildKeyReferenceContextFromReportDetails } from '@i18nprune/core';
import { resolveReferenceConfig } from '@i18nprune/core';
import { listHostJsonBasenames, readHostJsonUnknown, writeHostJson } from '@/shared/io/hostJson.js';
import { assertNotSourceTargetLocale } from '@/shared/locales/source.js';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { ISSUE_SYNC_METADATA_FLAG_CONFLICT } from '@/constants/issueCodes.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromSyncMissingLocaleFiles,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { emitRunErrorFromUnknown, emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEmitter } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';
import type { SyncOptions } from '@/types/command/sync/index.js';
import type { SyncJsonOutput } from '@/types/command/sync/json.js';
import type { SyncHumanLeafSummary } from '@i18nprune/core';
import type { SyncFileLine } from '@/types/command/sync/summary.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import type { LocaleMetadataReport } from '@/types/core/localeLeaves/index.js';
import type { DynamicKeySite, KeyObservation } from '@i18nprune/core/types';
import { parseSyncLangSelection, resolveSyncTargetFiles } from '@i18nprune/core';
import { resolveProjectReportData } from '@/shared/cache/reportData.js';
import { idleLocaleMetadataReportForSkippedSync } from '@/commands/sync/idleLocaleMetadataReport.js';

export type SyncJsonRunResult = {
  envelope: CliJsonEnvelope<'sync', SyncJsonOutput>;
  fileLines: SyncFileLine[];
  targets: string[];
  updated: number;
  dynamicSites: DynamicKeySite[];
  /** Requested locale codes with no matching file under `localesDir` (human-mode warning). */
  missingLocaleCodes: string[];
  /** Per-locale leaf stats for human stderr (not part of `--json`). */
  humanLeafSummaryByLocaleFile: Record<string, SyncHumanLeafSummary>;
};

/**
 * Runs sync filesystem work and builds the same JSON envelope as `sync --json`.
 * When `dryRun` is false, writes locale files (same as CLI). Throws on I/O errors (human mode);
 * the command layer catches for **`--json`** and emits **`buildIoReadFailureEnvelope`**.
 */
export function runSync(
  ctx: Context,
  opts: SyncOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): SyncJsonRunResult {
  const emit = runtime?.emit;
  const runId = runtime?.runId;
  emitRunEvent(emit, { type: 'run.started', op: 'sync', runId, at: nowMs() });
  emitRunEvent(emit, { type: 'run.progress.sync', op: 'sync', runId, at: nowMs(), phase: 'scan_dynamic_sites' });
  try {
    const eff = resolveReferenceConfig('sync', ctx.config);
    const { document: projectReport } = resolveProjectReportData(ctx);
    const observations = projectReport.details.keyObservations as KeyObservation[];
    const dynamicSites = projectReport.details.dynamicSites as DynamicKeySite[];
    const refCtx = buildKeyReferenceContextFromReportDetails(observations, dynamicSites, eff);
    emitRunEvent(emit, {
      type: 'run.progress.sync',
      op: 'sync',
      runId,
      at: nowMs(),
      phase: 'scan_dynamic_sites',
      current: dynamicSites.length,
      total: dynamicSites.length,
      label: `${String(dynamicSites.length)} dynamic key site(s)`,
    });
    const sourcePath = ctx.paths.sourceLocale;
    emitRunEvent(emit, {
      type: 'run.progress.sync',
      op: 'sync',
      runId,
      at: nowMs(),
      phase: 'read_source',
      label: sourcePath,
    });
    const fs = ctx.adapters.fs;
    const template = readHostJsonUnknown(sourcePath, fs);
    const sourceBase = path.basename(sourcePath, '.json');
    const dir = ctx.paths.localesDir;
    const localeJsonBasenames = listHostJsonBasenames(dir, fs);
    const sel = parseSyncLangSelection(opts.target);
    if (sel.mode === 'codes') {
      for (const code of sel.codes) {
        assertNotSourceTargetLocale('sync', code, sourcePath, {
          paths: ctx.paths,
          adapters: ctx.adapters,
        });
      }
    }
    const { targetFiles: targets, missingLocaleCodes } = resolveSyncTargetFiles({
      localeJsonBasenames,
      sourceJsonBasename: `${sourceBase}.json`,
      selection: sel,
    });
    emitRunEvent(emit, {
      type: 'run.progress.sync',
      op: 'sync',
      runId,
      at: nowMs(),
      phase: 'resolve_targets',
      total: targets.length,
    });

    let updated = 0;
    const fileLines: SyncFileLine[] = [];
    const humanLeafSummaryByLocaleFile: Record<string, SyncHumanLeafSummary> = {};
    const explicitStripMetadata = opts.stripMetadata === true;
    const explicitMetadata = opts.metadata === true;
    const modeDecision = resolveLocaleLeafMode({
      metadataFlag: explicitMetadata,
      stripMetadataFlag: explicitStripMetadata,
    });
    const sourceLeaves = collectStringLeaves(template);
    const sourceMap = new Map(sourceLeaves.map((leaf) => [leaf.path, leaf.value]));
    const localeMetadataReports: Record<string, LocaleMetadataReport> = {};

    for (let i = 0; i < targets.length; i++) {
      const file = targets[i]!;
      const full = path.join(dir, file);
      emitRunEvent(emit, {
        type: 'run.progress.sync',
        op: 'sync',
        runId,
        at: nowMs(),
        phase: 'build_target',
        target: file,
        current: i + 1,
        total: targets.length,
      });
      const cur = readHostJsonUnknown(full, fs);
      const mergeOpts =
        eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only'
          ? { uncertainKeepPrefixes: refCtx.uncertainPrefixes }
          : undefined;
      emitRunEvent(emit, {
        type: 'run.progress.sync',
        op: 'sync',
        runId,
        at: nowMs(),
        phase: 'merge',
        target: file,
        current: i + 1,
        total: targets.length,
      });
      const { next } = computeSyncedLocaleJson(
        template,
        cur,
        ctx.config.policies?.preserve,
        mergeOpts,
      );
      emitRunEvent(emit, {
        type: 'run.progress.sync',
        op: 'sync',
        runId,
        at: nowMs(),
        phase: 'prune',
        target: file,
        current: i + 1,
        total: targets.length,
      });
      humanLeafSummaryByLocaleFile[file] = summarizeSyncLeavesForHumanLog(sourceLeaves, cur, next);
      let finalNext: unknown = next;
      if (explicitStripMetadata || explicitMetadata) {
        const normalized = applyLocaleLeafMode({ localeJson: next, sourceMap, mode: modeDecision.mode });
        finalNext = normalized.next;
        localeMetadataReports[file] = normalized.report;
      } else {
        localeMetadataReports[file] = idleLocaleMetadataReportForSkippedSync(sourceMap.size);
      }
      const finalWouldChange = JSON.stringify(cur) !== JSON.stringify(finalNext);

      if (opts.dryRun) {
        fileLines.push({ path: full, changed: finalWouldChange });
        continue;
      }
      if (finalWouldChange) {
        emitRunEvent(emit, {
          type: 'run.progress.sync',
          op: 'sync',
          runId,
          at: nowMs(),
          phase: 'write_files',
          target: file,
          label: full,
        });
        writeHostJson(full, finalNext, fs);
        updated += 1;
      }
      fileLines.push({ path: full, changed: finalWouldChange });
    }
    emitRunEvent(emit, {
      type: 'run.progress.sync',
      op: 'sync',
      runId,
      at: nowMs(),
      phase: 'done',
      current: targets.length,
      total: targets.length,
    });

    const jsonPayload: SyncJsonOutput = {
      kind: 'sync',
      sourcePath,
      localesDir: dir,
      targetFiles: targets.length,
      writtenFiles: updated,
      dynamicKeySites: dynamicSites.length,
      dryRun: Boolean(opts.dryRun),
      files: fileLines,
      localeMetadataReports,
    };

    const issues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDynamicScanCount(dynamicSites.length),
      issuesFromSyncMissingLocaleFiles(missingLocaleCodes),
      modeDecision.conflict
        ? [
            {
              severity: 'warning' as const,
              code: ISSUE_SYNC_METADATA_FLAG_CONFLICT,
              message:
                'Both metadata-enable and strip-metadata were requested; strip-metadata takes precedence and locale leaves are written as plain strings.',
              docPath: 'locales/metadata/README',
            },
          ]
        : [],
    );

    const envelope = buildCliJsonEnvelope('sync', jsonPayload, {
      ok: true,
      issues,
      cwd: process.cwd(),
    });

    emitRunEvent(emit, {
      type: 'run.completed',
      op: 'sync',
      runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(emit, {
      type: 'run.summary',
      op: 'sync',
      runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: {
        targets: targets.length,
        written: updated,
        dynamicKeySites: dynamicSites.length,
      },
    });
    return { envelope, fileLines, targets, updated, dynamicSites, missingLocaleCodes, humanLeafSummaryByLocaleFile };
  } catch (err) {
    emitRunErrorFromUnknown(emit, {
      op: 'sync',
      runId,
      err,
      code: 'i18nprune.run.sync_failed',
      recoverable: false,
    });
    emitRunEvent(emit, {
      type: 'run.failed',
      op: 'sync',
      runId,
      at: nowMs(),
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      },
    });
    throw err;
  }
}
