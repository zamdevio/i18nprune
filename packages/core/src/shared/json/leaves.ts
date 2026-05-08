import type { StringLeaf } from '../../types/json/index.js';

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** Depth-first string leaves; array indices appear as `[i]` in paths. */
export function collectStringLeaves(
  root: unknown,
  prefix = '',
  out: StringLeaf[] = [],
): StringLeaf[] {
  if (typeof root === 'string') {
    if (prefix) out.push({ path: prefix, value: root });
    return out;
  }
  if (Array.isArray(root)) {
    root.forEach((item, i) => {
      const p = prefix ? `${prefix}[${i}]` : `[${i}]`;
      collectStringLeaves(item, p, out);
    });
    return out;
  }
  if (isPlainObject(root)) {
    for (const k of Object.keys(root)) {
      const p = prefix ? `${prefix}.${k}` : k;
      collectStringLeaves(root[k], p, out);
    }
  }
  return out;
}
