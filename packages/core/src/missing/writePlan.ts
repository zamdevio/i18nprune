import { hasLocaleLeafAtPath } from '../shared/json/localeLeafPath.js';
import { resolveLocaleSegmentAbsolutePath } from '../shared/locales/enumerate/resolveSegmentPath.js';
import { resolveLocalesLayoutFromContext } from '../shared/locales/layout/resolveLayout.js';
import { writeLocaleJsonFromContextSync } from '../shared/locales/index.js';
import {
  readLocaleJsonOrEmpty,
  readSourceLocaleLeaves,
  targetSegmentRelativePathForKey,
} from '../shared/locales/surface/index.js';
import type { CoreContext } from '../types/context/index.js';
import type { MissingSegmentWrite } from '../types/missing/missingRun.js';
import { applyMissingPaths } from './apply.js';

/**
 * Group missing key paths into per-segment writes for one locale code.
 * Skips paths already present in the target segment file on disk.
 */
export function createMissingWritePlan(
  ctx: CoreContext,
  localeCode: string,
  paths: readonly string[],
): MissingSegmentWrite[] {
  if (paths.length === 0) return [];

  const layout = resolveLocalesLayoutFromContext(ctx);
  const sourceLeaves = readSourceLocaleLeaves(ctx);
  const grouped = new Map<string, { relativePath: string; keys: string[] }>();

  for (const key of paths) {
    const relativePath = targetSegmentRelativePathForKey(ctx, localeCode, key, sourceLeaves);
    const absolutePath = resolveLocaleSegmentAbsolutePath({
      layout,
      path: ctx.adapters.path,
      locale: localeCode,
      segmentRelativePath: relativePath,
    });
    const current = readLocaleJsonOrEmpty(ctx, absolutePath);
    if (hasLocaleLeafAtPath(current, key)) {
      continue;
    }
    const bucket = grouped.get(absolutePath) ?? { relativePath, keys: [] };
    bucket.keys.push(key);
    grouped.set(absolutePath, bucket);
  }

  const writes: MissingSegmentWrite[] = [];
  for (const [targetPath, { relativePath, keys }] of grouped) {
    writes.push({
      targetPath,
      relativePath,
      paths: keys.sort(),
    });
  }
  writes.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return writes;
}

/** Apply placeholder leaves and write every segment in the plan. */
export function writeMissingWritePlan(
  ctx: CoreContext,
  plan: readonly MissingSegmentWrite[],
  placeholder: string,
): { filesWritten: number; pathsWritten: number } {
  let filesWritten = 0;
  let pathsWritten = 0;
  for (const entry of plan) {
    const localeJson = readLocaleJsonOrEmpty(ctx, entry.targetPath);
    const next = applyMissingPaths({ localeJson, paths: entry.paths, placeholder });
    writeLocaleJsonFromContextSync(ctx, entry.targetPath, next);
    filesWritten += 1;
    pathsWritten += entry.paths.length;
  }
  return { filesWritten, pathsWritten };
}
