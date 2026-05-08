/**
 * Sync engine (pure): merge/prune target locale JSON toward the source template shape.
 * Subpath: `@i18nprune/core/sync`. Filesystem orchestration stays in the CLI (`runSync`).
 */
export { computeSyncedLocaleJson, stripStructuredLeafMetadata } from './apply.js';
export { mergeToTemplateShape } from '../shared/json/merge.js';
export { pruneToTemplateShape } from '../shared/json/prune.js';
export {
  canonicalTemplatePathForCollectedLeaf,
  readLeafDisplayString,
  summarizeSyncLeavesForHumanLog,
  type SyncHumanLeafSummary,
} from './humanLeafSummary.js';
export { resolveSyncTargetFiles } from './resolveTargets.js';
export type { SyncLangSelection } from './resolveTargets.js';
