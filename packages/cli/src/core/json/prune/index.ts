import { deepClone } from '@/core/json/clone/index.js';
import { pathUnderAnyUncertainPrefix } from '@/core/reference/paths.js';

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export type PruneToTemplateOptions = {
  /** Keep extra object keys in `target` when their path matches (same semantics as merge). */
  uncertainKeepPrefixes?: string[];
};

/**
 * Remove keys from `target` that are not present in `template` (recursive object shape only).
 * Optionally retains extra branches that match uncertain key prefixes (sync with dynamic keys).
 */
export function pruneToTemplateShape(
  template: unknown,
  target: unknown,
  options?: PruneToTemplateOptions,
): unknown {
  return pruneWalk(template, target, '', options?.uncertainKeepPrefixes);
}

function pruneWalk(
  template: unknown,
  target: unknown,
  path: string,
  uncertainKeepPrefixes: string[] | undefined,
): unknown {
  if (template === null || typeof template !== 'object') {
    return target;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(target)) return [];
    const len = Math.min(template.length, target.length);
    const out: unknown[] = [];
    for (let i = 0; i < len; i += 1) {
      const seg = path ? `${path}[${String(i)}]` : `[${String(i)}]`;
      out.push(pruneWalk(template[i], target[i], seg, uncertainKeepPrefixes));
    }
    return out;
  }
  if (!isPlainObject(template)) return target;
  if (!isPlainObject(target)) return {};
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(template)) {
    if (k in target) {
      const p = path ? `${path}.${k}` : k;
      out[k] = pruneWalk(template[k], target[k], p, uncertainKeepPrefixes);
    }
  }
  if (uncertainKeepPrefixes?.length) {
    for (const k of Object.keys(target)) {
      if (k in template) continue;
      const p = path ? `${path}.${k}` : k;
      if (pathUnderAnyUncertainPrefix(p, uncertainKeepPrefixes)) {
        out[k] = deepClone((target as Record<string, unknown>)[k]);
      }
    }
  }
  return out;
}
