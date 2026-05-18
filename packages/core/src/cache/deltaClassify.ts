import { layoutMatches } from './localesLayout.js';
import type {
  CacheFileDelta,
  CachedLocalesLayout,
  ClassifiedCacheFileDelta,
  ClassifiedSrcDelta,
  FilesIndexStatus,
} from '../types/cache/index.js';
import { filesIndexIsUsable } from '../types/cache/filesIndex.js';

function normalizeRelPath(path: string): string {
  return path.replace(/\\/g, '/');
}

function unionKeys(a: ReadonlySet<string>, b: ReadonlySet<string>): Set<string> {
  return new Set([...a, ...b]);
}

/**
 * Split a merged `files.json` delta into src, source-locale, and target-locale buckets.
 * Uses union of current + baseline keys so **deleted** paths still classify correctly.
 */
export function classifyCacheFileDelta(input: {
  delta: CacheFileDelta;
  currentSrcFileKeys: ReadonlySet<string>;
  baselineSrcFileKeys: ReadonlySet<string>;
  currentLocaleSegmentKeys: ReadonlySet<string>;
  baselineLocaleSegmentKeys: ReadonlySet<string>;
  sourceLocaleSegmentKey: string;
  previousLayout?: CachedLocalesLayout;
  currentLayout: CachedLocalesLayout;
  filesIndexStatus: FilesIndexStatus;
}): ClassifiedCacheFileDelta {
  const src: ClassifiedSrcDelta = { added: [], changed: [], deleted: [] };
  const sourceLocale: string[] = [];
  const targetLocale: string[] = [];
  const sourceKey = normalizeRelPath(input.sourceLocaleSegmentKey);
  const knownSrcKeys = unionKeys(input.currentSrcFileKeys, input.baselineSrcFileKeys);
  const knownLocaleKeys = unionKeys(input.currentLocaleSegmentKeys, input.baselineLocaleSegmentKeys);

  const classifyPath = (path: string, kind: 'added' | 'changed' | 'deleted'): void => {
    if (knownSrcKeys.has(path)) {
      src[kind].push(path);
      return;
    }
    if (knownLocaleKeys.has(path)) {
      if (path === sourceKey) sourceLocale.push(path);
      else targetLocale.push(path);
    }
  };

  for (const path of input.delta.added.map(normalizeRelPath)) {
    classifyPath(path, 'added');
  }
  for (const path of input.delta.changed.map(normalizeRelPath)) {
    classifyPath(path, 'changed');
  }
  for (const path of input.delta.deleted.map(normalizeRelPath)) {
    classifyPath(path, 'deleted');
  }

  const layoutChanged =
    filesIndexIsUsable(input.filesIndexStatus) &&
    !layoutMatches(input.previousLayout, input.currentLayout);

  return {
    src,
    sourceLocale,
    targetLocale,
    layoutChanged,
    filesIndexStatus: input.filesIndexStatus,
  };
}

export function srcDeltaIsEmpty(src: ClassifiedSrcDelta): boolean {
  return src.added.length + src.changed.length + src.deleted.length === 0;
}

export function countSrcDeltaAffected(src: ClassifiedSrcDelta): number {
  return src.added.length + src.changed.length + src.deleted.length;
}
