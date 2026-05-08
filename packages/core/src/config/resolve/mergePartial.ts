/**
 * Deep-merge a partial config object onto a base (typically zip-resolved config).
 * Nested plain objects merge recursively; arrays and primitives replace.
 */
export function mergePartialConfigIntoBase(
  base: Record<string, unknown> | null | undefined,
  partial: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(base ?? {}) };
  for (const [k, v] of Object.entries(partial)) {
    const existing = out[k];
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      existing !== null &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      out[k] = mergePartialConfigIntoBase(existing as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}
