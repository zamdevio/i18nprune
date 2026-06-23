import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.join(scriptsDir, '../..');
export const coreRoot = path.join(repoRoot, 'packages/core');
export const corePkgPath = path.join(coreRoot, 'package.json');
export const rootIndexRepoPath = 'packages/core/src/index.ts';
export const rootIndexAbsPath = path.join(repoRoot, rootIndexRepoPath);

export const exportsCacheRoot = path.join(repoRoot, '.exports/cache');
export const exportsMetaPath = path.join(exportsCacheRoot, 'meta.json');

/** Cache dir key for working-tree snapshots — never reuse a commit SHA (avoids collision with HEAD). */
export const WORKTREE_CACHE_KEY = '__worktree__';

/** Full inventory snapshot (inventory, diff, graph, validate, trend). */
export const FULL_SNAPSHOT_FILENAME = 'inventory.full.json';
/** Timeline-only root summary (never loads full symbol graph). */
export const TIMELINE_SNAPSHOT_FILENAME = 'timeline.summary.json';

/** `meta.json` index shape (`entries`, requested refs, rollups). */
export const CACHE_META_VERSION = 1 as const;
/** On-disk snapshot JSON shape (`inventory.full.json`, `timeline.summary.json`). */
export const SNAPSHOT_VERSION = 1 as const;
/** Scanner logic generation (tiers, parser, graph rules) — bump invalidates all cached snapshots. */
export const TOOL_VERSION = 1 as const;

/** Published subpath → source entry (relative to packages/core). */
export const subpathSourceEntries: Record<string, string> = {
  '.': 'src/index.ts',
  shared: 'src/shared/index.ts',
  types: 'src/types/index.ts',
  'types/shared': 'src/types/shared/index.ts',
  locales: 'src/namespaces/locales.ts',
  generate: 'src/generate/index.ts',
  init: 'src/init/index.ts',
  config: 'src/config/index.ts',
  'report-schema': 'src/shared/report/index.ts',
  sync: 'src/sync/index.ts',
  validate: 'src/validate/index.ts',
  missing: 'src/missing/index.ts',
  cleanup: 'src/cleanup/index.ts',
  quality: 'src/quality/index.ts',
  'runtime/node': 'src/runtime/exports/node.ts',
  'runtime/web': 'src/runtime/exports/web.ts',
  'runtime/edge': 'src/runtime/exports/edge.ts',
  'runtime/helpers/sync': 'src/runtime/exports/helpers/sync.ts',
};

export function coreRepoPath(relativeToCore: string): string {
  return path.posix.join('packages/core', relativeToCore.replace(/\\/g, '/'));
}

export function fullSnapshotPathForSha(sha: string): string {
  return path.join(exportsCacheRoot, sha, FULL_SNAPSHOT_FILENAME);
}

export function timelineSnapshotPathForSha(sha: string): string {
  return path.join(exportsCacheRoot, sha, TIMELINE_SNAPSHOT_FILENAME);
}

export function cacheDirForSha(sha: string): string {
  return path.join(exportsCacheRoot, sha);
}
