import { mergeToTemplateShape, pruneToTemplateShape } from '@/core/json/index.js';
import type { MergeToTemplateOptions } from '@/core/json/merge/index.js';
import type { PreservePolicy } from '@/types/config/index.js';

/**
 * Merge + prune a target locale JSON toward the source template shape (sync semantics).
 * Pure: no filesystem; use in `sync` and tests.
 */
export function computeSyncedLocaleJson(
  template: unknown,
  cur: unknown,
  preserve: PreservePolicy | undefined,
  mergeOpts: MergeToTemplateOptions | undefined,
): { next: unknown; wouldChange: boolean } {
  let next = mergeToTemplateShape(template, cur, preserve, mergeOpts);
  next = pruneToTemplateShape(template, next, mergeOpts);
  const wouldChange = JSON.stringify(cur) !== JSON.stringify(next);
  return { next, wouldChange };
}
