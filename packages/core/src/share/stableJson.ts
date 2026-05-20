/**
 * Deterministic JSON stringification for stable content hashes (sorted object keys).
 */
export function stableStringify(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'number' || t === 'boolean') return JSON.stringify(value);
  if (t === 'string') return JSON.stringify(value);
  if (t === 'bigint') return JSON.stringify(value.toString());
  if (t !== 'object') return JSON.stringify(null);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
