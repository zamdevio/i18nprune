import { resolveLocalesLayoutFromContext } from '../shared/locales/layout/resolveLayout.js';
import { readLocaleJsonFromContextSync, readLocaleSegmentFromContext } from '../shared/locales/read/index.js';
import { readSourceLocaleLeaves } from '../shared/locales/surface/localeSurface.js';
import { readLocaleJsonOrEmpty, resolvePairedSourceSegmentAbsolutePath } from '../shared/locales/surface/index.js';
import { listLocaleSegmentTargets, sourceLocaleCodeFromContext } from '../shared/locales/targets/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { ISSUE_SCAN_DYNAMIC_KEY_SITES } from '../shared/constants/issueCodes.js';
import { formatListShownOmitted } from '../shared/constants/listDisplay.js';
import { emitRunMessage } from '../shared/run/index.js';
import { resolveProjectAnalysis } from '../analysis/index.js';
import { finalizeLocaleSuggestions } from '../suggestions/index.js';
import {
  detectLocalePlaceholderLeaves,
  formatSourcePlaceholderMessage,
  formatTargetPlaceholderMessage,
  issuesFromSourcePlaceholderLeaves,
  issuesFromTargetPlaceholderLeaves,
  sourcePlaceholderValues,
} from '../shared/sourcePlaceholders/index.js';
import { formatCountMap, mergeReviewLocaleStats } from './aggregate.js';
import { buildReviewJsonData } from './report.js';
import { parseReviewTargetCodes } from './targetScope.js';
import type { CoreContext } from '../types/context/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { LocalePlaceholderLeaf, SourcePlaceholderLeaf } from '../shared/sourcePlaceholders/index.js';
import type { ReviewHostHooks, ReviewLocaleStats, ReviewRunOptions, ReviewRunResult } from '../types/review/index.js';
import type { RunMessageLevel } from '../types/shared/run/index.js';

function basenameNoExt(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const name = normalized.split('/').pop() ?? normalized;
  return name.endsWith('.json') ? name.slice(0, -5) : name;
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

function emitReviewMessage(
  host: ReviewHostHooks,
  input: {
    level: RunMessageLevel;
    message: string;
    target?: string;
    data?: Record<string, string | number | boolean | null>;
  },
): void {
  emitRunMessage(host.emit, { ...input, op: 'review', runId: host.runId });
}

function reviewLocaleGroupLabel(localeCode: string, segmentFiles: readonly string[]): string {
  if (segmentFiles.length === 0) return localeCode;
  if (segmentFiles.length === 1) return `${localeCode} · ${segmentFiles[0]!}`;
  const sorted = [...segmentFiles].sort((a, b) => a.localeCompare(b));
  const preview = sorted.slice(0, 3).join(', ');
  const tail = sorted.length > 3 ? ` (+${String(sorted.length - 3)} more)` : '';
  return `${localeCode} · ${String(sorted.length)} segment files: ${preview}${tail}`;
}

function emitReviewLocaleBlock(host: ReviewHostHooks, label: string, v: ReviewLocaleStats, target?: string): void {
  const fileTarget = target ?? label;
  emitReviewMessage(host, { level: 'info', message: `  ${label}`, target: fileTarget });
  if (v.structuredLeaves === 0) {
    emitReviewMessage(host, {
      level: 'info',
      message: `Leaves: ${String(v.stringPaths)} · source-identical: ${String(v.englishIdentical)} — all plain-string leaves (no structured \`{ value, … }\` metadata at paths yet).`,
      target: fileTarget,
    });
  } else {
    emitReviewMessage(host, {
      level: 'info',
      message: `Leaves: ${String(v.stringPaths)} · source-identical: ${String(v.englishIdentical)} · needsReview: true ${String(v.needsReviewTrue)} · false ${String(v.needsReviewFalse)} · unset ${String(v.needsReviewUnset)}`,
      target: fileTarget,
    });
  }
  emitReviewMessage(host, {
    level: 'info',
    message: `Shape: legacy strings ${String(v.legacyLeaves)} · structured ${String(v.structuredLeaves)}`,
    target: fileTarget,
  });

  if (v.structuredLeaves > 0) {
    const { none, low, mid, high } = v.confidenceBuckets;
    emitReviewMessage(host, {
      level: 'info',
      message: `Confidence: none ${String(none)} · <0.5 ${String(low)} · 0.5–0.85 ${String(mid)} · 0.85+ ${String(high)}`,
      target: fileTarget,
    });
    const statusLine = formatCountMap(v.byStatus);
    const sourceLine = formatCountMap(v.bySource);
    emitReviewMessage(host, { level: 'info', message: `By status: ${statusLine || '—'}`, target: fileTarget });
    emitReviewMessage(host, { level: 'info', message: `By source: ${sourceLine || '—'}`, target: fileTarget });
    const missNr = v.structuredLeavesMissingNeedsReview;
    const missConf = v.structuredLeavesMissingConfidence;
    if (missNr > 0 || missConf > 0) {
      emitReviewMessage(host, {
        level: 'info',
        message: `Structured metadata gaps: needsReview missing/invalid on ${String(missNr)} leaf(es) · confidence missing/null/invalid on ${String(missConf)} leaf(es) (optional fields; validate does not flag these yet).`,
        target: fileTarget,
      });
    }
  }

  if (v.legacyLeaves > 0 && v.structuredLeaves > 0) {
    emitReviewMessage(host, {
      level: 'warn',
      message: `${String(v.legacyLeaves)} plain-string leaf(es) coexist with structured leaves — sync and generate still write string-shaped values at template paths today, so rich metadata is not applied there until a shared structured writer lands.`,
      target: fileTarget,
    });
  }
}

export function runReview(
  ctx: CoreContext,
  opts: ReviewRunOptions,
  host: ReviewHostHooks,
): ReviewRunResult {
  const analysis = resolveProjectAnalysis(ctx, { emit: host.emit, op: 'review', runId: host.runId });
  const { dynamicSites: dynamicKeySites, dynamicActive: dynamicKeySitesActive, dynamicCommented: dynamicKeySitesCommented } =
    analysis.counts;
  const layout = resolveLocalesLayoutFromContext(ctx);
  const sourcePath = ctx.paths.sourceLocale;
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const placeholderValues = sourcePlaceholderValues(ctx.config.missing?.placeholder);
  const sourcePlaceholderLeaves: SourcePlaceholderLeaf[] = detectLocalePlaceholderLeaves({
    leaves: readSourceLocaleLeaves(ctx),
    placeholderValues,
    localeRole: 'source',
    localeCode: sourceCode,
    localePath: sourcePath,
  }).map((leaf) => ({ path: leaf.path, value: leaf.value }));

  const codes = parseReviewTargetCodes(opts.target);
  let segments = listLocaleSegmentTargets(ctx).filter(
    (s) => normalizeLanguageCode(s.locale) !== sourceCode,
  );
  if (codes !== undefined) {
    const want = new Set(codes.map((c) => normalizeLanguageCode(c)));
    segments = segments.filter((s) => want.has(normalizeLanguageCode(s.locale)));
  }

  const targetLocaleJsonByFile: Record<string, unknown> = {};
  const pairedSourceLocaleJsonByTargetFile: Record<string, unknown> = {};
  const targetPlaceholderLeaves: LocalePlaceholderLeaf[] = [];
  for (const segment of segments) {
    const file = segment.reportKey;
    const full = segment.absolutePath;
    const targetRead = readLocaleSegmentFromContext(ctx, full);
    const targetRaw = targetRead.ok ? targetRead.document : {};
    targetLocaleJsonByFile[file] = targetRaw;
    const pairedSourcePath = resolvePairedSourceSegmentAbsolutePath(ctx, segment.relativePath, segment.locale);
    pairedSourceLocaleJsonByTargetFile[file] = readLocaleJsonOrEmpty(ctx, pairedSourcePath);
    targetPlaceholderLeaves.push(
      ...detectLocalePlaceholderLeaves({
        leaves: targetRead.ok ? targetRead.leaves : [],
        placeholderValues,
        localeRole: 'target',
        localeCode: segment.locale,
        localePath: full,
      }),
    );
  }

  const payload = buildReviewJsonData({
    sourceLocalePath: sourcePath,
    localesDir: ctx.paths.localesDir,
    dynamicKeySites,
    dynamicKeySitesActive,
    dynamicKeySitesCommented,
    parity: ctx.config.policies?.parity,
    sourceLocaleJson: readLocaleJsonFromContextSync(ctx, sourcePath),
    targetLocaleJsonByFile,
    pairedSourceLocaleJsonByTargetFile,
    path: ctx.adapters.path,
    layoutStructure: layout.structure,
  });
  const scopeLabel = codes === undefined ? 'all non-source locales' : `locales: ${codes.join(', ')}`;
  const segmentFileCount = Object.keys(payload.locales).length;
  const localeCodeByFile = new Map(
    segments.map((segment) => [segment.reportKey, normalizeLanguageCode(segment.locale)] as const),
  );
  const localeCodesInRun = [
    ...new Set(
      Object.keys(payload.locales).map((file) => localeCodeByFile.get(file) ?? basenameNoExt(file)),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const runScopeLabel =
    layout.mode === 'flat_file'
      ? `files in this run: ${String(segmentFileCount)}`
      : `locales in this run: ${String(localeCodesInRun.length)} · ${String(segmentFileCount)} segment files`;
  emitReviewMessage(host, {
    level: 'info',
    message: `Source locale: ${payload.sourceLocale} · scope: ${scopeLabel} · ${runScopeLabel}`,
  });
  emitReviewMessage(host, {
    level: 'info',
    message:
      'Reads plain string leaves and structured `{ value, status?, confidence?, needsReview?, source? }` terminals; nested objects without `value` are traversed.',
  });
  if (dynamicKeySitesActive > 0) {
    emitReviewMessage(host, {
      level: 'warn',
      message: `${String(dynamicKeySitesActive)} translation call(s) use a non-literal key — run \`i18nprune validate\` or \`i18nprune locales dynamic\` for file:line samples.`,
      data: { dynamicKeySites, dynamicKeySitesActive, dynamicKeySitesCommented },
    });
  }
  const groupedByLocale = new Map<string, { files: string[]; stats: ReviewLocaleStats[] }>();
  for (const [file, stats] of Object.entries(payload.locales)) {
    const localeCode = localeCodeByFile.get(file) ?? basenameNoExt(file);
    const bucket = groupedByLocale.get(localeCode) ?? { files: [], stats: [] };
    bucket.files.push(file);
    bucket.stats.push(stats);
    groupedByLocale.set(localeCode, bucket);
  }
  const listLimit = host.listLimit ?? localeCodesInRun.length;
  const shownLocaleCodes = localeCodesInRun.slice(0, listLimit);
  for (const localeCode of shownLocaleCodes) {
    const bucket = groupedByLocale.get(localeCode);
    if (!bucket) continue;
    bucket.files.sort((a, b) => a.localeCompare(b));
    const merged = mergeReviewLocaleStats(bucket.stats);
    if (layout.mode === 'flat_file' || bucket.files.length === 1) {
      emitReviewLocaleBlock(host, bucket.files[0]!, merged, localeCode);
    } else {
      emitReviewLocaleBlock(host, reviewLocaleGroupLabel(localeCode, bucket.files), merged, localeCode);
    }
  }
  const omittedLocales = localeCodesInRun.length - shownLocaleCodes.length;
  if (omittedLocales > 0) {
    emitReviewMessage(host, {
      level: 'detail',
      message: formatListShownOmitted(`  · ${String(shownLocaleCodes.length)} locale(s) shown`, omittedLocales),
    });
  }
  if (sourcePlaceholderLeaves.length > 0) {
    emitReviewMessage(host, {
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
      emitReviewMessage(host, {
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
  const sourceIdenticalCount = Object.values(payload.locales).reduce(
    (sum, stats) => sum + stats.englishIdentical,
    0,
  );

  const finalPayload = finalizeLocaleSuggestions(
    host,
    {
      op: 'review',
      ctx,
      analysis,
      targetLocaleCodes: localeCodesInRun,
      sourceIdenticalCount,
    },
    payload,
  );

  return {
    payload: finalPayload,
    keyObservationsCount: analysis.keyObservations.length,
    issues: [
      ...issuesFromDynamicScanCount(dynamicKeySitesActive),
      ...issuesFromSourcePlaceholderLeaves(sourcePlaceholderLeaves),
      ...issuesFromTargetPlaceholderLeaves(targetPlaceholderLeaves),
    ],
  };
}
