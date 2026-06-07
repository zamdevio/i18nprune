import { resolveProjectAnalysis } from '../analysis/index.js';
import { finalizeLocaleSuggestions } from '../suggestions/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import {
  ISSUE_QUALITY_ENGLISH_IDENTICAL_LEAVES,
  ISSUE_SCAN_DYNAMIC_KEY_SITES,
} from '../shared/constants/issueCodes.js';
import { emitRunMessage } from '../shared/run/index.js';
import {
  detectLocalePlaceholderLeaves,
  formatSourcePlaceholderMessage,
  formatTargetPlaceholderMessage,
  issuesFromSourcePlaceholderLeaves,
  issuesFromTargetPlaceholderLeaves,
  sourcePlaceholderValues,
} from '../shared/sourcePlaceholders/index.js';
import { listLocaleSegmentTargets, sourceLocaleCodeFromContext } from '../shared/locales/targets/index.js';
import { readLocaleSegmentFromContext } from '../shared/locales/read/index.js';
import { formatListShownOmitted } from '../shared/constants/listDisplay.js';
import { buildQualityLocaleReport, formatQualityLocaleRowLabel } from './localeReport.js';
import { buildQualityJsonData } from './payload.js';
import type { CoreContext } from '../types/context/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { LocalePlaceholderLeaf, SourcePlaceholderLeaf } from '../shared/sourcePlaceholders/index.js';
import type { QualityHostHooks, QualityRunOptions, QualityRunResult } from '../types/quality/index.js';

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

function issuesFromQualityEnglishIdentical(total: number): Issue[] {
  if (total <= 0) return [];
  return [
    {
      severity: 'info',
      code: ISSUE_QUALITY_ENGLISH_IDENTICAL_LEAVES,
      message: `${String(total)} leaf value(s) still equal the source locale (parity / copy candidates).`,
      docPath: 'commands/quality/README',
    },
  ];
}

export function runQuality(
  ctx: CoreContext,
  opts: QualityRunOptions,
  host: QualityHostHooks,
): QualityRunResult {
  const analysis = resolveProjectAnalysis(ctx, { emit: host.emit, op: 'quality', runId: host.runId });
  const dynamicKeySites = analysis.dynamicSites.length;
  const sourcePath = ctx.paths.sourceLocale;
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const placeholderValues = sourcePlaceholderValues(ctx.config.missing?.placeholder);

  const report = buildQualityLocaleReport(ctx, {
    target: opts.target,
    parity: ctx.config.policies?.parity,
  });
  const { sourceLeaves, rows, perFile, total, segmentFileCount, layoutMode } = report;

  const sourcePlaceholderLeaves: SourcePlaceholderLeaf[] = detectLocalePlaceholderLeaves({
    leaves: sourceLeaves,
    placeholderValues,
    localeRole: 'source',
    localeCode: sourceCode,
    localePath: sourcePath,
  }).map((leaf) => ({ path: leaf.path, value: leaf.value }));

  let segmentTargets = listLocaleSegmentTargets(ctx).filter(
    (s) => normalizeLanguageCode(s.locale) !== sourceCode,
  );
  if (opts.target) {
    const want = normalizeLanguageCode(opts.target);
    segmentTargets = segmentTargets.filter((s) => normalizeLanguageCode(s.locale) === want);
  }
  const targetPlaceholderLeaves: LocalePlaceholderLeaf[] = [];
  for (const segment of segmentTargets) {
    const read = readLocaleSegmentFromContext(ctx, segment.absolutePath);
    const leaves = read.ok ? read.leaves : [];
    targetPlaceholderLeaves.push(
      ...detectLocalePlaceholderLeaves({
        leaves,
        placeholderValues,
        localeRole: 'target',
        localeCode: segment.locale,
        localePath: segment.absolutePath,
      }),
    );
  }

  const targetLocaleCount = rows.filter((row) => !row.isSourceLocale).length;
  const payload = buildQualityJsonData({
    total,
    perFile,
    dynamicKeySites,
    sourceLocale: sourceCode,
    localesDir: ctx.paths.localesDir,
    localeCount: rows.length,
    targetLocaleCount,
    files: rows,
  });

  const scopeLabel =
    layoutMode === 'flat_file'
      ? `${String(rows.length)} locale(s) in ${payload.localesDir}`
      : `${String(rows.length)} locale(s) in ${payload.localesDir} · ${String(segmentFileCount)} segment files`;

  emitRunMessage(host.emit, {
    op: 'quality',
    runId: host.runId,
    level: 'info',
    message: scopeLabel,
    data: { locales: rows.length, segmentFiles: segmentFileCount },
  });
  const listLimit = host.listLimit ?? rows.length;
  const shownRows = rows.slice(0, listLimit);
  for (const row of shownRows) {
    emitRunMessage(host.emit, {
      op: 'quality',
      runId: host.runId,
      level: 'detail',
      message: `  ${formatQualityLocaleRowLabel(row)}`,
      target: row.code,
      data: {
        leaves: row.leafCount,
        sourceIdentical: row.sourceIdenticalLeafCount ?? 0,
        segmentCount: row.segmentCount,
      },
    });
  }
  const omittedLocales = rows.length - shownRows.length;
  if (omittedLocales > 0) {
    emitRunMessage(host.emit, {
      op: 'quality',
      runId: host.runId,
      level: 'detail',
      message: formatListShownOmitted(`  · ${String(shownRows.length)} locale(s) shown`, omittedLocales),
    });
  }
  emitRunMessage(host.emit, {
    op: 'quality',
    runId: host.runId,
    level: 'info',
    message: `Source-identical leaves (target value still equals source locale at path): ${String(total)}`,
    data: { total },
  });
  if (dynamicKeySites > 0) {
    emitRunMessage(host.emit, {
      op: 'quality',
      runId: host.runId,
      level: 'warn',
      message: `${String(dynamicKeySites)} translation call(s) use a non-literal key — separate from the source-identical parity count above; use \`validate\` or \`locales dynamic\` for samples.`,
      data: { dynamicKeySites },
    });
  }
  if (sourcePlaceholderLeaves.length > 0) {
    emitRunMessage(host.emit, {
      op: 'quality',
      runId: host.runId,
      level: 'warn',
      message: formatSourcePlaceholderMessage({
        count: sourcePlaceholderLeaves.length,
        samplePaths: sourcePlaceholderLeaves.slice(0, 5).map((leaf) => leaf.path),
      }),
      target: sourceCode,
      data: { sourcePlaceholderLeaves: sourcePlaceholderLeaves.length },
    });
  }
  if (targetPlaceholderLeaves.length > 0) {
    const byLocale = new Map<string, LocalePlaceholderLeaf[]>();
    for (const leaf of targetPlaceholderLeaves) {
      byLocale.set(leaf.localeCode, [...(byLocale.get(leaf.localeCode) ?? []), leaf]);
    }
    for (const [localeCode, leaves] of byLocale) {
      emitRunMessage(host.emit, {
        op: 'quality',
        runId: host.runId,
        level: 'warn',
        message: formatTargetPlaceholderMessage({
          count: leaves.length,
          samplePaths: leaves.slice(0, 5).map((leaf) => leaf.path),
          targetLabel: localeCode,
        }),
        target: localeCode,
        data: { targetPlaceholderLeaves: leaves.length },
      });
    }
  }

  const issues = [
    ...issuesFromDynamicScanCount(dynamicKeySites),
    ...issuesFromQualityEnglishIdentical(total),
    ...issuesFromSourcePlaceholderLeaves(sourcePlaceholderLeaves),
    ...issuesFromTargetPlaceholderLeaves(targetPlaceholderLeaves),
  ];

  const targetLocaleCodes = opts.target
    ? [normalizeLanguageCode(opts.target)]
    : rows.filter((row) => !row.isSourceLocale).map((row) => row.code);

  const finalPayload = finalizeLocaleSuggestions(
    host,
    {
      op: 'quality',
      ctx,
      analysis,
      targetLocaleCodes,
      sourceIdenticalCount: total,
    },
    payload,
  );

  return { payload: finalPayload, issues, keyObservationsCount: analysis.keyObservations.length };
}
