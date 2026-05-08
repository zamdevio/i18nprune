import { existsRuntimeFsSync, listRuntimeFsDirSync } from '@i18nprune/core';
import type { ResolvedPaths } from '@/types/core/context/index.js';
import type { ResolvedPathKind } from '@/types/commands/config/index.js';
import type { RuntimeFsPort } from '@i18nprune/core';

/** Filesystem role of each resolved path (distinct from `fieldSources`, which is config-layer provenance). */
export function resolvedPathKinds(
  paths: ResolvedPaths,
  fs: RuntimeFsPort,
): Record<keyof ResolvedPaths, ResolvedPathKind> {
  const kind = (abs: string): ResolvedPathKind => {
    if (!existsRuntimeFsSync(abs, fs)) return 'missing';
    try {
      listRuntimeFsDirSync(abs, fs);
      return 'directory';
    } catch {
      return 'file';
    }
  };
  return {
    sourceLocale: kind(paths.sourceLocale),
    localesDir: kind(paths.localesDir),
    srcRoot: kind(paths.srcRoot),
  };
}
