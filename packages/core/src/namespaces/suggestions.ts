export {
  computeExtraTargetKeys,
  computeExtraTargetKeysForTargets,
  listTargetSegmentPathsForKeys,
  type ExtraTargetKeysResult,
} from '../suggestions/computeExtraTargetKeys.js';
export { computeUnusedSourceKeys, type UnusedSourceKeysResult } from '../suggestions/computeUnusedSourceKeys.js';
export { buildLocaleSuggestions, type BuildLocaleSuggestionsInput } from '../suggestions/build.js';
export { formatLocaleSuggestionHuman } from '../suggestions/format.js';
export { emitLocaleSuggestions, finalizeLocaleSuggestions } from '../suggestions/emit.js';
export type { LocaleSuggestion, LocaleSuggestionKind } from '../types/suggestions/index.js';
