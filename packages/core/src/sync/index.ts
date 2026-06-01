/**
 * Sync engine: merge/prune target locale JSON toward the source template shape.
 * Subpath: `@i18nprune/core/sync`.
 */
export { computeSyncedLocaleJson, stripStructuredLeafMetadata } from './apply.js';
export { emitSyncHumanMessages, idleLocaleMetadataReportForSkippedSync, runSync } from './run.js';
export { mergeToTemplateShape } from '../shared/json/merge.js';
export { pruneToTemplateShape } from '../shared/json/prune.js';
export {
  canonicalTemplatePathForCollectedLeaf,
  readLeafDisplayString,
  summarizeSyncLeavesForHumanLog,
} from './humanLeafSummary.js';
export { resolveSyncTargetFiles } from './resolveTargets.js';
export type { SyncLangSelection } from './resolveTargets.js';
export type {
  SyncFileLine,
  SyncHostHooks,
  SyncHumanLeafSummary,
  SyncJsonOutput,
  SyncLocaleDisplayGroup,
  SyncRunOptions,
  SyncRunResult,
} from '../types/sync/index.js';
