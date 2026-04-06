function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** Remove keys from `target` that are not present in `template` (recursive object shape only). */
export function pruneToTemplateShape(template: unknown, target: unknown): unknown {
  if (template === null || typeof template !== 'object') {
    return target;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(target)) return [];
    const len = Math.min(template.length, target.length);
    const out: unknown[] = [];
    for (let i = 0; i < len; i += 1) {
      out.push(pruneToTemplateShape(template[i], target[i]));
    }
    return out;
  }
  if (!isPlainObject(template)) return target;
  if (!isPlainObject(target)) return {};
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(template)) {
    if (k in target) {
      out[k] = pruneToTemplateShape(template[k], target[k]);
    }
  }
  return out;
}
