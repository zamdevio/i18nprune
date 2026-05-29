function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** Deep-clone JSON-like data with every object key sorted A→Z (deterministic locale writes). */
export function sortJsonObjectKeysAsc(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonObjectKeysAsc(item));
  }
  if (!isPlainObject(value)) return value;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortJsonObjectKeysAsc(value[key]);
  }
  return sorted;
}

/** Compare locale JSON by semantic content (ignores object key order). */
export function localeJsonContentEquals(a: unknown, b: unknown): boolean {
  return JSON.stringify(sortJsonObjectKeysAsc(a)) === JSON.stringify(sortJsonObjectKeysAsc(b));
}
