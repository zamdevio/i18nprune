import { getAtPath, setAtPath } from '@/core/json/path/index.js';
import { deepClone } from '@/core/json/clone/index.js';
import type { PreservePolicy } from '@/types/config/index.js';

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function pathMatchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`);
}

export function isPreservePath(path: string, policy: PreservePolicy | undefined): boolean {
  if (!policy) return false;
  if (policy.copyKeys?.some((k) => path === k || pathMatchesPrefix(path, k))) return true;
  if (policy.copyPrefixes?.some((p) => path === p || path.startsWith(p))) return true;
  return false;
}

/**
 * Merge `target` toward `template` shape: keep existing translations where paths match;
 * fill missing from template (source strings); remove extras; preserve paths forced to source.
 */
export function mergeToTemplateShape(
  template: unknown,
  target: unknown,
  preserve: PreservePolicy | undefined,
): unknown {
  return mergeWalk(template, target, preserve);
}

function mergeWalk(template: unknown, target: unknown, preserve: PreservePolicy | undefined): unknown {
  if (typeof template === 'string') {
    if (typeof target === 'string') return target;
    return template;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(target)) target = [];
    const out: unknown[] = [];
    const tArr = target as unknown[];
    for (let i = 0; i < template.length; i += 1) {
      out.push(mergeWalk(template[i], tArr[i], preserve));
    }
    return out;
  }
  if (isPlainObject(template)) {
    const tObj = isPlainObject(target) ? target : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(template)) {
      out[k] = mergeWalk(template[k], tObj[k], preserve);
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
