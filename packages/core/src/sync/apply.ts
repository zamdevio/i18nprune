import { mergeToTemplateShape } from '../shared/json/merge.js';
import type { MergeToTemplateOptions } from '../shared/json/merge.js';
import { pruneToTemplateShape } from '../shared/json/prune.js';
import type { PreservePolicy } from '../types/policies/index.js';

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

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * Convert structured locale terminals (`{ value: string, ... }`) into plain string leaves.
 * Keeps unrelated object/array structure intact.
 */
export function stripStructuredLeafMetadata(root: unknown): unknown {
  if (Array.isArray(root)) return root.map((v) => stripStructuredLeafMetadata(v));
  if (!isPlainObject(root)) return root;
  if (typeof root.value === 'string') return root.value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(root)) {
    out[k] = stripStructuredLeafMetadata(v);
  }
  return out;
}
