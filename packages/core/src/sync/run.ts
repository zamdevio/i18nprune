import { collectTranslationSurfaceLeaves } from '../shared/localeLeaves/index.js';
import { applyLocaleLeafMode, resolveLocaleLeafMode } from '../shared/localeLeaves/index.js';
import { buildKeyReferenceContextFromReportDetails } from '../shared/reference/context.js';
import { resolveReferenceConfig } from '../shared/reference/resolveConfig.js';
import { parseSyncLangSelection } from '../locales/targets.js';
import { assertNotSourceTargetLocale } from '../locales/source.js';
import { existsRuntimeFsSync, listRuntimeFsDirSync } from '../runtime/helpers/sync/fs.js';
import { readJsonFromRuntimeFsSync } from '../runtime/helpers/sync/readJson.js';
import { writeRuntimeJsonPretty } from '../generate/io/writeRuntimeJson.js';
import {
  ISSUE_SCAN_DYNAMIC_KEY_SITES,
  ISSUE_SYNC_LOCALE_FILE_NOT_FOUND,
  ISSUE_SYNC_METADATA_FLAG_CONFLICT,
} from '../shared/constants/issueCodes.js';
import { emitRunMessage } from '../shared/run/index.js';
import { computeSyncedLocaleJson } from './apply.js';
import { summarizeSyncLeavesForHumanLog } from './humanLeafSummary.js';
import { resolveSyncTargetFiles } from './resolveTargets.js';
import type { CoreContext } from '../types/generate/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { LocaleMetadataRepairReason, LocaleMetadataReport } from '../types/localeLeaves/index.js';
import type { SyncHostHooks, SyncRunOptions, SyncRunResult } from '../types/sync/index.js';

function listLocaleJsonBasenames(dirPath: string, ctx: CoreContext): string[] {
  const fs = ctx.adapters.fs;
  if (!existsRuntimeFsSync(dirPath, fs)) return [];
  return listRuntimeFsDirSync(dirPath, fs)
    .filter((e) => e.kind === 'file' && e.name.endsWith('.json') && !e.name.endsWith('.meta.json'))
    .map((e) => e.name);
}

function zeroByReason(): Record<LocaleMetadataRepairReason, number> {
  return {
    legacy_string_promoted: 0,
    non_object_replaced: 0,
    missing_value: 0,
    invalid_status: 0,
    invalid_confidence: 0,
    invalid_needs_review: 0,
    invalid_needs_translation_again: 0,
    invalid_source: 0,
    canonical_metadata_materialized: 0,
  };
}

/** Per-file `localeMetadataReports` row when sync does not apply a metadata mode. */
export function idleLocaleMetadataReportForSkippedSync(totalSourceLeafPaths: number): LocaleMetadataReport {
  return {
    mode: 'legacy_string',
    totalSourceLeafPaths,
    unchangedLeaves: totalSourceLeafPaths,
    structuredLeavesWritten: 0,
    promotedLegacyLeaves: 0,
    repairedCorruptLeaves: 0,
    strippedStructuredLeaves: 0,
    missingPathsHydratedFromSource: 0,
    byReason: zeroByReason(),
    changedPathsSample: [],
    leafDecisions: [],
  };
}

function issuesFromDynamicScanCount(count: number): Issue[] {
  if (count <= 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_SCAN_DYNAMIC_KEY_SITES,
      message: `${String(count)} translation call(s) use a non-literal key — static analysis cannot enumerate computed keys as fixed paths.`,
      docPath: 'dynamic/README',
    },
  ];
}

function issuesFromSyncMissingLocaleFiles(localeCodes: readonly string[]): Issue[] {
  if (localeCodes.length === 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_SYNC_LOCALE_FILE_NOT_FOUND,
      message: `Locale file(s) not found under locales dir (skipped): ${localeCodes.map((c) => `${c}.json`).join(', ')}`,
      docPath: 'commands/sync/README',
    },
  ];
}

function issueFromMetadataFlagConflict(conflict: boolean): Issue[] {
  if (!conflict) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_SYNC_METADATA_FLAG_CONFLICT,
      message:
        'Both metadata-enable and strip-metadata were requested; strip-metadata takes precedence and locale leaves are written as plain strings.',
      docPath: 'locales/metadata/README',
    },
  ];
}

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

export function emitSyncHumanMessages(
  host: Pick<SyncHostHooks, 'emit' | 'runId'>,
  input: {
    result: SyncRunResult;
    dryRun: boolean;
    listLimit: number;
    explicitStripMetadata: boolean;
    explicitMetadata: boolean;
  },
): void {
  const { result } = input;
  if (result.missingLocaleCodes.length > 0) {
    emitRunMessage(host.emit, {
      op: 'sync',
      runId: host.runId,
      level: 'warn',
      message: `locale file(s) not found (skipped): ${result.missingLocaleCodes.map((m) => `${m}.json`).join(', ')}`,
    });
  }
  if (result.dynamicSites.length > 0) {
    emitRunMessage(host.emit, {
      op: 'sync',
      runId: host.runId,
      level: 'warn',
      message: `${String(result.dynamicSites.length)} translation call(s) use a non-literal key — sync only aligns locale JSON shapes; computed keys from code are not merged or enumerated.`,
      data: { dynamicSites: result.dynamicSites.length },
    });
  }
  emitRunMessage(host.emit, {
    op: 'sync',
    runId: host.runId,
    level: 'info',
    message: `${String(result.fileLines.length)} target file(s) · ${String(result.dynamicSites.length)} dynamic key site(s)`,
  });
  const changed = result.fileLines.filter((f) => f.changed).length;
  const verb = input.dryRun ? 'Would change' : 'Updated';
  emitRunMessage(host.emit, {
    op: 'sync',
    runId: host.runId,
    level: 'info',
    message: `${verb}: ${String(changed)} · Unchanged: ${String(result.fileLines.length - changed)}`,
  });
  for (const f of result.fileLines.slice(0, input.listLimit)) {
    const mark = f.changed ? '✓' : '·';
    const tail = f.changed ? (input.dryRun ? ' (would write)' : ' (written)') : ' (unchanged)';
    emitRunMessage(host.emit, {
      op: 'sync',
      runId: host.runId,
      level: 'detail',
      message: `  ${mark} ${f.path}${tail}`,
      path: f.path,
      data: { changed: f.changed },
    });
  }
  if (result.fileLines.length > input.listLimit) {
    emitRunMessage(host.emit, {
      op: 'sync',
      runId: host.runId,
      level: 'detail',
      message: `  … ${String(result.fileLines.length - input.listLimit)} more file(s) not listed`,
    });
  }
  if (result.dynamicSites.length > 0) {
    emitRunMessage(host.emit, {
      op: 'sync',
      runId: host.runId,
      level: 'info',
      message: 'Dynamic keys are not merged by sync — see `i18nprune validate` and `i18nprune locales dynamic`.',
    });
  }
  const reports = result.payload.localeMetadataReports;
  for (const file of result.targets) {
    const s = result.humanLeafSummaryByLocaleFile[file];
    if (!s) continue;
    emitRunMessage(host.emit, {
      op: 'sync',
      runId: host.runId,
      level: 'info',
      message: `${file}: ${String(s.hydratedFromSource)} leaf path(s) filled from source · ${String(s.preservedExistingLeaves)} kept · ${String(s.prunedExtraLeaves)} extra path(s) removed (not in source)`,
      target: file,
    });
    const metaLine = syncLocaleMetadataDetailLine(reports?.[file], input.explicitStripMetadata, input.explicitMetadata);
    if (metaLine !== undefined) {
      emitRunMessage(host.emit, {
        op: 'sync',
        runId: host.runId,
        level: 'detail',
        message: `  ● ${metaLine}`,
        target: file,
      });
    }
  }
}

export function runSync(ctx: CoreContext, opts: SyncRunOptions, host: SyncHostHooks): SyncRunResult {
  host.emitProgress({ type: 'run.progress.sync', phase: 'scan_dynamic_sites' });
  const referenceData = host.loadReferenceData();
  const observations = [...referenceData.keyObservations];
  const dynamicSites = [...referenceData.dynamicSites];
  const eff = resolveReferenceConfig('sync', ctx.config);
  const refCtx = buildKeyReferenceContextFromReportDetails(observations, dynamicSites, eff);
  host.emitProgress({
    type: 'run.progress.sync',
    phase: 'scan_dynamic_sites',
    current: dynamicSites.length,
    total: dynamicSites.length,
    label: `${String(dynamicSites.length)} dynamic key site(s)`,
  });

  const sourcePath = ctx.paths.sourceLocale;
  host.emitProgress({ type: 'run.progress.sync', phase: 'read_source', label: sourcePath });
  const template = readJsonFromRuntimeFsSync(sourcePath, ctx.adapters.fs);
  const sourceBase = ctx.adapters.path.basename(sourcePath, '.json');
  const dir = ctx.paths.localesDir;
  const localeJsonBasenames = listLocaleJsonBasenames(dir, ctx);
  const sel = parseSyncLangSelection(opts.target);
  if (sel.mode === 'codes') {
    for (const code of sel.codes) {
      assertNotSourceTargetLocale('sync', code, sourcePath, {
        paths: ctx.paths,
        path: ctx.adapters.path,
      });
    }
  }
  const { targetFiles: targets, missingLocaleCodes } = resolveSyncTargetFiles({
    localeJsonBasenames,
    sourceJsonBasename: `${sourceBase}.json`,
    selection: sel,
  });
  host.emitProgress({
    type: 'run.progress.sync',
    phase: 'resolve_targets',
    total: targets.length,
  });

  let updated = 0;
  const fileLines: SyncRunResult['fileLines'] = [];
  const humanLeafSummaryByLocaleFile: SyncRunResult['humanLeafSummaryByLocaleFile'] = {};
  const explicitStripMetadata = opts.stripMetadata === true;
  const explicitMetadata = opts.metadata === true;
  const modeDecision = resolveLocaleLeafMode({
    metadataFlag: explicitMetadata,
    stripMetadataFlag: explicitStripMetadata,
  });
  const sourceLeaves = collectTranslationSurfaceLeaves(template);
  const sourceMap = new Map(sourceLeaves.map((leaf) => [leaf.path, leaf.value]));
  const localeMetadataReports: Record<string, LocaleMetadataReport> = {};

  for (let i = 0; i < targets.length; i++) {
    const file = targets[i]!;
    const full = ctx.adapters.path.join(dir, file);
    host.emitProgress({
      type: 'run.progress.sync',
      phase: 'build_target',
      target: file,
      current: i + 1,
      total: targets.length,
    });
    const cur = readJsonFromRuntimeFsSync(full, ctx.adapters.fs);
    const mergeOpts =
      eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only'
        ? { uncertainKeepPrefixes: refCtx.uncertainPrefixes }
        : undefined;
    host.emitProgress({
      type: 'run.progress.sync',
      phase: 'merge',
      target: file,
      current: i + 1,
      total: targets.length,
    });
    const { next } = computeSyncedLocaleJson(template, cur, ctx.config.policies?.preserve, mergeOpts);
    host.emitProgress({
      type: 'run.progress.sync',
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
      host.emitProgress({
        type: 'run.progress.sync',
        phase: 'write_files',
        target: file,
        label: full,
      });
      writeRuntimeJsonPretty(full, finalNext, ctx.adapters);
      updated += 1;
    }
    fileLines.push({ path: full, changed: finalWouldChange });
  }
  host.emitProgress({
    type: 'run.progress.sync',
    phase: 'done',
    current: targets.length,
    total: targets.length,
  });

  const payload = {
    kind: 'sync' as const,
    sourcePath,
    localesDir: dir,
    targetFiles: targets.length,
    writtenFiles: updated,
    dynamicKeySites: dynamicSites.length,
    dryRun: Boolean(opts.dryRun),
    files: fileLines,
    localeMetadataReports,
  };

  const issues = [
    ...issuesFromDynamicScanCount(dynamicSites.length),
    ...issuesFromSyncMissingLocaleFiles(missingLocaleCodes),
    ...issueFromMetadataFlagConflict(modeDecision.conflict),
  ];

  return {
    payload,
    issues,
    fileLines,
    targets,
    updated,
    dynamicSites,
    missingLocaleCodes,
    humanLeafSummaryByLocaleFile,
  };
}
