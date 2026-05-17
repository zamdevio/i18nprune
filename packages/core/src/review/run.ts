import { existsRuntimeFsSync, listRuntimeFsDirSync } from '../runtime/helpers/sync/fs.js';
import { readLocaleJsonFromContextSync } from '../shared/locales/io/contextSync.js';
import { ISSUE_SCAN_DYNAMIC_KEY_SITES } from '../shared/constants/issueCodes.js';
import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import { emitRunMessage } from '../shared/run/index.js';
import { resolveProjectAnalysis } from '../analysis/index.js';
import {
  detectLocalePlaceholderLeaves,
  formatSourcePlaceholderMessage,
  formatTargetPlaceholderMessage,
  issuesFromSourcePlaceholderLeaves,
  issuesFromTargetPlaceholderLeaves,
  sourcePlaceholderValues,
} from '../shared/sourcePlaceholders/index.js';
import { formatCountMap } from './aggregate.js';
import { buildReviewJsonData } from './report.js';
import { filterLocaleFilesForReview, parseReviewTargetCodes } from './targetScope.js';
import type { CoreContext } from '../types/generate/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { LocalePlaceholderLeaf, SourcePlaceholderLeaf } from '../shared/sourcePlaceholders/index.js';
import type { ReviewHostHooks, ReviewLocaleStats, ReviewRunOptions, ReviewRunResult } from '../types/review/index.js';
import type { RunMessageLevel } from '../types/shared/run/index.js';

function listLocaleJsonBasenames(ctx: CoreContext, dirPath: string): string[] {
  const fs = ctx.adapters.fs;
  if (!existsRuntimeFsSync(dirPath, fs)) return [];
  return listRuntimeFsDirSync(dirPath, fs)
    .filter((e) => e.kind === 'file' && e.name.endsWith('.json') && !e.name.endsWith('.meta.json'))
    .map((e) => e.name);
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

function emitReviewLocaleBlock(host: ReviewHostHooks, file: string, v: ReviewLocaleStats): void {
  emitReviewMessage(host, { level: 'info', message: `  ${file}`, target: file });
  if (v.structuredLeaves === 0) {
    emitReviewMessage(host, {
      level: 'info',
      message: `Leaves: ${String(v.stringPaths)} · source-identical: ${String(v.englishIdentical)} — all plain-string leaves (no structured \`{ value, … }\` metadata at paths yet).`,
      target: file,
    });
  } else {
    emitReviewMessage(host, {
      level: 'info',
      message: `Leaves: ${String(v.stringPaths)} · source-identical: ${String(v.englishIdentical)} · needsReview: true ${String(v.needsReviewTrue)} · false ${String(v.needsReviewFalse)} · unset ${String(v.needsReviewUnset)}`,
      target: file,
    });
  }
  emitReviewMessage(host, {
    level: 'info',
    message: `Shape: legacy strings ${String(v.legacyLeaves)} · structured ${String(v.structuredLeaves)}`,
    target: file,
  });

  if (v.structuredLeaves > 0) {
    const { none, low, mid, high } = v.confidenceBuckets;
    emitReviewMessage(host, {
      level: 'info',
      message: `Confidence: none ${String(none)} · <0.5 ${String(low)} · 0.5–0.85 ${String(mid)} · 0.85+ ${String(high)}`,
      target: file,
    });
    const statusLine = formatCountMap(v.byStatus);
    const sourceLine = formatCountMap(v.bySource);
    emitReviewMessage(host, { level: 'info', message: `By status: ${statusLine || '—'}`, target: file });
    emitReviewMessage(host, { level: 'info', message: `By source: ${sourceLine || '—'}`, target: file });
    const missNr = v.structuredLeavesMissingNeedsReview;
    const missConf = v.structuredLeavesMissingConfidence;
    if (missNr > 0 || missConf > 0) {
      emitReviewMessage(host, {
        level: 'info',
        message: `Structured metadata gaps: needsReview missing/invalid on ${String(missNr)} leaf(es) · confidence missing/null/invalid on ${String(missConf)} leaf(es) (optional fields; validate does not flag these yet).`,
        target: file,
      });
    }
  }

  if (v.legacyLeaves > 0 && v.structuredLeaves > 0) {
    emitReviewMessage(host, {
      level: 'warn',
      message: `${String(v.legacyLeaves)} plain-string leaf(es) coexist with structured leaves — sync and generate still write string-shaped values at template paths today, so rich metadata is not applied there until a shared structured writer lands.`,
      target: file,
    });
  }
}

export function runReview(
  ctx: CoreContext,
  opts: ReviewRunOptions,
  host: ReviewHostHooks,
): ReviewRunResult {
  const analysis = resolveProjectAnalysis(ctx, { emit: host.emit, op: 'review', runId: host.runId });
  const dynamicKeySites = analysis.dynamicSites.length;
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readLocaleJsonFromContextSync(ctx, sourcePath);
  const sourceBase = ctx.adapters.path.basename(sourcePath, '.json');
  const placeholderValues = sourcePlaceholderValues(ctx.config.missing?.placeholder);
  const sourcePlaceholderLeaves: SourcePlaceholderLeaf[] = detectLocalePlaceholderLeaves({
    leaves: collectTranslationSurfaceLeaves(sourceRaw),
    placeholderValues,
    localeRole: 'source',
    localeCode: sourceBase,
    localePath: sourcePath,
  }).map((leaf) => ({ path: leaf.path, value: leaf.value }));
  const dir = ctx.paths.localesDir;
  const files = listLocaleJsonBasenames(ctx, dir).filter((f) => f !== `${sourceBase}.json`);
  const codes = parseReviewTargetCodes(opts.target);
  const filtered = filterLocaleFilesForReview(ctx.adapters.path, files, codes);

  const targetLocaleJsonByFile: Record<string, unknown> = {};
  const targetPlaceholderLeaves: LocalePlaceholderLeaf[] = [];
  for (const file of filtered) {
    const full = ctx.adapters.path.join(dir, file);
    const targetRaw = readLocaleJsonFromContextSync(ctx, full);
    targetLocaleJsonByFile[file] = targetRaw;
    targetPlaceholderLeaves.push(
      ...detectLocalePlaceholderLeaves({
        leaves: collectTranslationSurfaceLeaves(targetRaw),
        placeholderValues,
        localeRole: 'target',
        localeCode: ctx.adapters.path.basename(file, '.json'),
        localePath: full,
      }),
    );
  }

  const payload = buildReviewJsonData({
    sourceLocalePath: sourcePath,
    localesDir: ctx.paths.localesDir,
    dynamicKeySites,
    parity: ctx.config.policies?.parity,
    sourceLocaleJson: sourceRaw,
    targetLocaleJsonByFile,
    path: ctx.adapters.path,
  });
  const scopeLabel = codes === undefined ? 'all non-source locales' : `locales: ${codes.join(', ')}`;
  emitReviewMessage(host, {
    level: 'info',
    message: `Source locale: ${payload.sourceLocale} · scope: ${scopeLabel} · files in this run: ${String(Object.keys(payload.locales).length)}`,
  });
  emitReviewMessage(host, {
    level: 'info',
    message:
      'Reads plain string leaves and structured `{ value, status?, confidence?, needsReview?, source? }` terminals; nested objects without `value` are traversed.',
  });
  if (dynamicKeySites > 0) {
    emitReviewMessage(host, {
      level: 'warn',
      message: `${String(dynamicKeySites)} translation call(s) use a non-literal key — run \`i18nprune validate\` or \`i18nprune locales dynamic\` for file:line samples.`,
      data: { dynamicKeySites },
    });
  }
  for (const [f, v] of Object.entries(payload.locales)) {
    emitReviewLocaleBlock(host, f, v);
  }
  if (sourcePlaceholderLeaves.length > 0) {
    emitReviewMessage(host, {
      level: 'warn',
      message: formatSourcePlaceholderMessage({
        count: sourcePlaceholderLeaves.length,
        samplePaths: sourcePlaceholderLeaves.slice(0, 5).map((leaf) => leaf.path),
      }),
      target: sourceBase,
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
  if (Object.values(payload.locales).some((v) => v.englishIdentical > 0)) {
    emitReviewMessage(host, {
      level: 'info',
      message:
        'Tip: source-identical leaves match the source locale string at the same path — use `generate --resume` (or a full `generate`) to refresh translations.',
    });
  }

  return {
    payload,
    keyObservationsCount: analysis.keyObservations.length,
    issues: [
      ...issuesFromDynamicScanCount(dynamicKeySites),
      ...issuesFromSourcePlaceholderLeaves(sourcePlaceholderLeaves),
      ...issuesFromTargetPlaceholderLeaves(targetPlaceholderLeaves),
    ],
  };
}
