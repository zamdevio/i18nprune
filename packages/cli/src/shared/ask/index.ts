/**
 * Shared interactive prompt gating and reusable confirm flows for CLI commands.
 */
export { canAsk } from './gate.js';
export {
  groupKeysByTopSegment,
  promptApprovedRemovalKeys,
} from './removal.js';
export type { PromptRemovalKeysMode, PromptRemovalKeysOptions } from '@/types/shared/ask/index.js';
