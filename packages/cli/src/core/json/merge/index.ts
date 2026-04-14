import { getAtPath, setAtPath } from '@/core/json/path/index.js';
import { deepClone } from '@/core/json/clone/index.js';
import { pathUnderAnyUncertainPrefix } from '@/core/reference/paths.js';
import type { PreservePolicy } from '@/types/config/index.js';

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export type MergeToTemplateOptions = {
  /**
   * Keep extra **object** keys present in `target` but not in `template` when their dotted path
   * matches any prefix (uncertain / dynamic key protection). Array length extras are unchanged.
   */
  uncertainKeepPrefixes?: string[];
};

/**
 * Merge `target` toward `template` shape: keep existing translations where paths match;
 * fill missing from template (source strings); remove extras; preserve paths forced to source.
 */
export function mergeToTemplateShape(
  template: unknown,
  target: unknown,
  preserve: PreservePolicy | undefined,
  options?: MergeToTemplateOptions,
): unknown {
  return mergeWalk(template, target, preserve, '', options?.uncertainKeepPrefixes);
}

function mergeWalk(
  template: unknown,
  target: unknown,
  preserve: PreservePolicy | undefined,
  path: string,
  uncertainKeepPrefixes: string[] | undefined,
): unknown {
  if (typeof template === 'string') {
    if (typeof target === 'string') return target;
    return template;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(target)) target = [];
    const out: unknown[] = [];
    const tArr = target as unknown[];
    for (let i = 0; i < template.length; i += 1) {
      const seg = path ? `${path}[${String(i)}]` : `[${String(i)}]`;
      out.push(mergeWalk(template[i], tArr[i], preserve, seg, uncertainKeepPrefixes));
    }
    return out;
  }
  if (isPlainObject(template)) {
    const tObj = isPlainObject(target) ? target : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(template)) {
      const p = path ? `${path}.${k}` : k;
      out[k] = mergeWalk(template[k], tObj[k], preserve, p, uncertainKeepPrefixes);
    }
    if (uncertainKeepPrefixes?.length) {
      for (const k of Object.keys(tObj)) {
        if (k in template) continue;
        const p = path ? `${path}.${k}` : k;
        if (pathUnderAnyUncertainPrefix(p, uncertainKeepPrefixes)) {
          out[k] = deepClone(tObj[k]);
        }
      }
    }
    return out;
  }
  return deepClone(template);
}

/** Apply preserve: set paths in `target` from `source` verbatim. */
export function applyPreserveFromSource(
  target: unknown,
  source: unknown,
  paths: string[],
): unknown {
  let out = deepClone(target);
  for (const p of paths) {
    const v = getAtPath(source, p);
    if (v !== undefined) {
      out = setAtPath(out, p, deepClone(v));
    }
  }
  return out;
}
