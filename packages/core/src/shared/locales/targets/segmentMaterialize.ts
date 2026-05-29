import { getLocaleLeafAtPath } from '../../json/localeLeafPath.js';
import { setAtPath } from '../../json/path.js';
import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import type { LocaleSegmentWriteTarget } from '../../../types/locales/segmentWritePlan.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';
import { isStructuredLocaleLeafNode } from '../leaves/walk/translationSurfaceWalk.js';
import { resolveLocaleSegmentAbsolutePath } from '../enumerate/resolveSegmentPath.js';
import { getProjectedLeafString, projectLocaleLeaves } from '../projection.js';
import { readFlatLocaleJsonSurface } from '../read/flatFileSurface.js';
import { swapLocaleInSegmentRelativePath } from './segmentWritePlan.js';

/** Merge translation-surface leaves into one locale JSON object (schema leaf paths). */
export function localeJsonFromTranslationSurfaceLeaves(leaves: readonly TranslationSurfaceLeaf[]): unknown {
  let out: unknown = {};
  for (const leaf of leaves) {
    out = setAtPath(out, leaf.path, leaf.value);
  }
  return out;
}

function pathsForSourceSegment(input: {
  layout: ResolvedLocalesLayout;
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
  sourceLocaleCode: string;
  sourceRelativePath: string;
  sourceLeaves: readonly TranslationSurfaceLeaf[];
  singleSegmentFallback: boolean;
}): Set<string> {
  const fromOrigin = input.sourceLeaves.filter((l) => l.fileOrigin?.relativePath === input.sourceRelativePath);
  if (fromOrigin.length > 0) {
    return new Set(fromOrigin.map((l) => l.path));
  }

  const absoluteFile = resolveLocaleSegmentAbsolutePath({
    layout: input.layout,
    path: input.path,
    locale: input.sourceLocaleCode,
    segmentRelativePath: input.sourceRelativePath,
  });
  const read = readFlatLocaleJsonSurface({
    fs: input.fs,
    path: input.path,
    absoluteFile,
    localesDir: input.layout.directoryAbsolute,
    structure: input.layout.structure,
  });
  if (read.ok) {
    const filePaths = new Set(read.leaves.map((l) => l.path));
    const intersected = input.sourceLeaves.filter((l) => filePaths.has(l.path)).map((l) => l.path);
    if (intersected.length > 0) {
      return new Set(intersected);
    }
  }

  if (input.singleSegmentFallback) {
    return new Set(input.sourceLeaves.map((l) => l.path));
  }
  return new Set();
}

/**
 * Split one translated working locale into per-segment JSON documents for write.
 *
 * @remarks Groups schema/source leaves by source segment path; reads each source file when
 * `fileOrigin` does not match bundle-relative segment paths.
 */
export function materializeGenerateWorkingBySegment(input: {
  working: unknown;
  sourceLeaves: readonly TranslationSurfaceLeaf[];
  segments: readonly LocaleSegmentWriteTarget[];
  structure: ResolvedLocalesLayout['structure'];
  sourceLocaleCode: string;
  layout: ResolvedLocalesLayout;
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
}): { segment: LocaleSegmentWriteTarget; document: unknown }[] {
  const sourceLocale = input.sourceLocaleCode;
  const projected = projectLocaleLeaves(input.working);
  const singleSegmentFallback = input.segments.length === 1;

  return input.segments.map((segment) => {
    const sourceRel =
      swapLocaleInSegmentRelativePath({
        structure: input.structure,
        relativePath: segment.relativePath,
        targetLocale: sourceLocale,
      }) ?? segment.relativePath;

    const pathsForSegment = pathsForSourceSegment({
      layout: input.layout,
      fs: input.fs,
      path: input.path,
      sourceLocaleCode: sourceLocale,
      sourceRelativePath: sourceRel,
      sourceLeaves: input.sourceLeaves,
      singleSegmentFallback,
    });

    let document: unknown = {};
    for (const leafPath of pathsForSegment) {
      const workingValue = getLocaleLeafAtPath(input.working, leafPath);
      let value: unknown;
      if (isStructuredLocaleLeafNode(workingValue)) {
        value = workingValue;
      } else {
        const projectedValue = getProjectedLeafString(projected, leafPath);
        value = projectedValue !== undefined ? projectedValue : workingValue;
      }
      if (value !== undefined) {
        document = setAtPath(document, leafPath, value);
      }
    }
    return { segment, document };
  });
}
