import { resolveLocalesLayoutFromContext } from '../shared/locales/layout/resolveLayout.js';
import { readLocaleSegmentFromContext } from '../shared/locales/read/index.js';
import { readLocaleLeavesForCode, readSourceLocaleLeaves } from '../shared/locales/surface/localeSurface.js';
import {
  localeCodesFromContext,
  segmentsForLocaleCode,
  sourceLocaleCodeFromContext,
} from '../shared/locales/targets/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { computeEnglishIdenticalCounts } from './englishIdentical.js';
import type { CoreContext } from '../types/context/index.js';
import type { QualityFileLine } from '../types/quality/index.js';
import type { ParityPolicy } from '../types/policies/index.js';

function qualityLocaleCodes(ctx: CoreContext, targetCode: string | undefined): string[] {
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const all = localeCodesFromContext(ctx);
  if (!targetCode) return all;
  const want = normalizeLanguageCode(targetCode);
  if (want === sourceCode) return [sourceCode];
  return all.filter((code) => normalizeLanguageCode(code) === want || normalizeLanguageCode(code) === sourceCode);
}

export function buildQualityLocaleReport(
  ctx: CoreContext,
  input: { target?: string; parity?: ParityPolicy },
): {
  sourceLeaves: ReturnType<typeof readSourceLocaleLeaves>;
  rows: QualityFileLine[];
  perFile: Record<string, number>;
  total: number;
  segmentFileCount: number;
  layoutMode: ReturnType<typeof resolveLocalesLayoutFromContext>['mode'];
} {
  const layout = resolveLocalesLayoutFromContext(ctx);
  const sourceLeaves = readSourceLocaleLeaves(ctx);
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const localeCodes = qualityLocaleCodes(ctx, input.target).sort((a, b) => a.localeCompare(b));

  const segmentTargets = localeCodes.flatMap((code) =>
    segmentsForLocaleCode(ctx, code).map((segment) => {
      const read = readLocaleSegmentFromContext(ctx, segment.absolutePath);
      return {
        fileBasename: segment.reportKey,
        locale: segment.locale,
        relativePath: segment.relativePath,
        leaves: read.ok ? read.leaves : [],
      };
    }),
  );

  const nonSourceTargets = segmentTargets.filter(
    (segment) => normalizeLanguageCode(segment.locale) !== sourceCode,
  );
  const { total, perFile } = computeEnglishIdenticalCounts({
    sourceLeaves,
    targets: nonSourceTargets.map((segment) => ({
      fileBasename: segment.fileBasename,
      leaves: segment.leaves,
    })),
    parity: input.parity,
  });

  const sortedLocaleCodes = [
    ...localeCodes.filter((code) => normalizeLanguageCode(code) === sourceCode),
    ...localeCodes.filter((code) => normalizeLanguageCode(code) !== sourceCode),
  ];

  const rows: QualityFileLine[] = sortedLocaleCodes.map((code) => {
    const normalized = normalizeLanguageCode(code);
    const segments = segmentsForLocaleCode(ctx, normalized);
    const segmentRelativePaths = segments.map((s) => s.relativePath).sort((a, b) => a.localeCompare(b));
    const isSourceLocale = normalized === sourceCode;
    const leafCount = isSourceLocale
      ? readLocaleLeavesForCode(ctx, normalized).length
      : segments.reduce((sum, segment) => {
          const entry = segmentTargets.find((t) => t.fileBasename === segment.reportKey);
          return sum + (entry?.leaves.length ?? 0);
        }, 0);
    const sourceIdenticalLeafCount = isSourceLocale
      ? null
      : segmentRelativePaths.reduce((sum, rel) => {
          const key = segments.find((s) => s.relativePath === rel)?.reportKey;
          return sum + (key !== undefined ? (perFile[key] ?? 0) : 0);
        }, 0);

    return {
      code: normalized,
      file: segmentRelativePaths[0] ?? `${normalized}.json`,
      segmentCount: segments.length,
      segmentRelativePaths,
      leafCount,
      isSourceLocale,
      sourceIdenticalLeafCount,
    };
  });

  return {
    sourceLeaves,
    rows,
    perFile,
    total,
    segmentFileCount: segmentTargets.length,
    layoutMode: layout.mode,
  };
}

export function formatQualityLocaleRowLabel(row: QualityFileLine): string {
  const files =
    row.segmentCount > 1
      ? `${String(row.segmentCount)} segment files`
      : (row.segmentRelativePaths[0] ?? row.file);
  const extras = row.isSourceLocale
    ? 'source locale'
    : `source-identical: ${String(row.sourceIdenticalLeafCount ?? 0)}`;
  return `${row.code} · ${files} · leaves ${String(row.leafCount)} · ${extras}`;
}
