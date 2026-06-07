import { isPreservePath } from '../policies/preserve.js';
import { hasLocaleLeafAtPath } from '../shared/json/localeLeafPath.js';
import { readLocaleJsonFromContextSync } from '../shared/locales/read/index.js';
import { readLocaleLeavesForCode } from '../shared/locales/surface/localeSurface.js';
import { segmentsForLocaleCode, targetLocaleCodesFromContext } from '../shared/locales/targets/index.js';
import type { ProjectAnalysis } from '../types/analysis/index.js';
import type { CoreContext } from '../types/context/index.js';

export type ExtraTargetKeysResult = {
  localeCode: string;
  candidates: string[];
  count: number;
};

/** Segment paths (relative under locales root) that contain at least one of the given key paths. */
export function listTargetSegmentPathsForKeys(
  ctx: CoreContext,
  localeCode: string,
  keys: readonly string[],
): string[] {
  if (keys.length === 0) return [];
  return segmentsForLocaleCode(ctx, localeCode)
    .filter((segment) => {
      const raw = readLocaleJsonFromContextSync(ctx, segment.absolutePath);
      return keys.some((key) => hasLocaleLeafAtPath(raw, key));
    })
    .map((segment) => segment.relativePath.replace(/\\/g, '/'));
}

/**
 * Target-locale key paths present on disk but not in the current code scan.
 * Extra keys vs the code scan — prune with `cleanup --target <code>`.
 */
export function computeExtraTargetKeys(
  ctx: CoreContext,
  analysis: ProjectAnalysis,
  localeCode: string,
): ExtraTargetKeysResult {
  const leaves = readLocaleLeavesForCode(ctx, localeCode);
  const preserve = ctx.config.policies?.preserve;
  const candidates = leaves
    .map((leaf) => leaf.path)
    .filter((path) => !analysis.usage.resolvedKeys.has(path) && !isPreservePath(path, preserve));
  return { localeCode, candidates, count: candidates.length };
}

/** Non-source locales with at least one extra key vs the scan. */
export function computeExtraTargetKeysForTargets(
  ctx: CoreContext,
  analysis: ProjectAnalysis,
  localeCodes?: readonly string[],
): ExtraTargetKeysResult[] {
  const codes = localeCodes ?? targetLocaleCodesFromContext(ctx);
  return codes
    .map((code) => computeExtraTargetKeys(ctx, analysis, code))
    .filter((result) => result.count > 0);
}
