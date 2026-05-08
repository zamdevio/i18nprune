import { getAtPath, setAtPath } from './path.js';
import { deepClone } from './clone.js';
import { pathUnderAnyUncertainPrefix } from '../reference/paths.js';

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
 *
 * Terminals follow the template type: plain string leaves preserve **whole** `{ value, … }` locale objects
 * when the template leaf is a string (structured metadata is not flattened here — use strip flows when needed).
 */
export function mergeToTemplateShape(
  template: unknown,
  target: unknown,
  preserve: unknown | undefined,
  options?: MergeToTemplateOptions,
): unknown {
  return mergeWalk(template, target, preserve, '', options?.uncertainKeepPrefixes);
}

function mergeWalk(
  template: unknown,
  target: unknown,
  preserve: unknown | undefined,
  path: string,
  uncertainKeepPrefixes: string[] | undefined,
): unknown {
  void preserve;
  if (typeof template === 'string') {
    if (typeof target === 'string') return target;
    if (isPlainObject(target) && typeof target.value === 'string') {
      return deepClone(target);
    }
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
