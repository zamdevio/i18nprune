/**
 * Shared interactive prompt gating and reusable confirm flows for CLI commands.
 */
export { canAsk } from '@/core/ask/gate.js';
export {
  groupKeysByTopSegment,
  promptApprovedRemovalKeys,
} from '@/core/ask/removal.js';
export type { PromptRemovalKeysMode, PromptRemovalKeysOptions } from '@/core/ask/removal.js';
