import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import { readLocaleJsonFromContextSync } from '../shared/locales/read/bundle.js';
import {
  listLocaleSegmentTargets,
  sourceLocaleCodeFromContext,
} from '../shared/locales/targets/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { resolveProjectAnalysis } from '../analysis/index.js';
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
import { computeEnglishIdenticalCounts } from './englishIdentical.js';
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
  const sourceRaw = readLocaleJsonFromContextSync(ctx, sourcePath);
  const sourceLeaves = collectTranslationSurfaceLeaves(sourceRaw);
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const placeholderValues = sourcePlaceholderValues(ctx.config.missing?.placeholder);
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
  const targets = segmentTargets.map((segment) => {
    const targetRaw = readLocaleJsonFromContextSync(ctx, segment.absolutePath);
    const leaves = collectTranslationSurfaceLeaves(targetRaw);
    targetPlaceholderLeaves.push(
      ...detectLocalePlaceholderLeaves({
        leaves,
        placeholderValues,
        localeRole: 'target',
        localeCode: segment.locale,
        localePath: segment.absolutePath,
      }),
    );
    return { fileBasename: segment.reportKey, locale: segment.locale, leaves };
  });

  const { total, perFile } = computeEnglishIdenticalCounts({
    sourceLeaves,
    targets,
    parity: ctx.config.policies?.parity,
  });
  const files = [
    {
      code: sourceCode,
      file: ctx.adapters.path.basename(sourcePath),
      leafCount: sourceLeaves.length,
      isSourceLocale: true,
      sourceIdenticalLeafCount: null,
    },
    ...targets.map((target) => ({
      code: normalizeLanguageCode(target.locale),
      file: target.fileBasename,
      leafCount: target.leaves.length,
      isSourceLocale: false,
      sourceIdenticalLeafCount: perFile[target.fileBasename] ?? 0,
    })),
  ];
  const payload = buildQualityJsonData({
    total,
    perFile,
    dynamicKeySites,
    sourceLocale: sourceCode,
    localesDir: ctx.paths.localesDir,
    localeCount: files.length,
    targetLocaleCount: targets.length,
    files,
  });
  emitRunMessage(host.emit, {
    op: 'quality',
    runId: host.runId,
    level: 'info',
    message: `${String(payload.localeCount)} locale file(s) in ${payload.localesDir}`,
    data: { locales: payload.localeCount },
  });
  for (const row of payload.files) {
    const extras = row.isSourceLocale
      ? 'source locale'
      : `source-identical: ${String(row.sourceIdenticalLeafCount ?? 0)}`;
    emitRunMessage(host.emit, {
      op: 'quality',
      runId: host.runId,
      level: 'detail',
      message: `  ${row.file} · leaves ${String(row.leafCount)} · ${extras}`,
      target: row.code,
      data: { leaves: row.leafCount, sourceIdentical: row.sourceIdenticalLeafCount ?? 0 },
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

  return { payload, issues, keyObservationsCount: analysis.keyObservations.length };
}
