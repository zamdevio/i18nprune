import fs from 'node:fs';
import type { ResolvedPaths } from '@/types/core/context/index.js';
import type { ResolvedPathKind } from '@/types/commands/config/index.js';

/** Filesystem role of each resolved path (distinct from `fieldSources`, which is config-layer provenance). */
export function resolvedPathKinds(paths: ResolvedPaths): Record<keyof ResolvedPaths, ResolvedPathKind> {
  const kind = (abs: string): ResolvedPathKind => {
    try {
      return fs.statSync(abs).isDirectory() ? 'directory' : 'file';
    } catch {
      return 'missing';
    }
  };
  return {
    sourceLocale: kind(paths.sourceLocale),
    localesDir: kind(paths.localesDir),
    srcRoot: kind(paths.srcRoot),
  };
}
