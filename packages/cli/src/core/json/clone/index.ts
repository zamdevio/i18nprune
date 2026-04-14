export function deepClone<T>(x: T): T {
  if (x === null || typeof x !== 'object') return x;
  if (Array.isArray(x)) return x.map((e) => deepClone(e)) as T;
  const o: Record<string, unknown> = {};
  for (const k of Object.keys(x as object)) {
    o[k] = deepClone((x as Record<string, unknown>)[k]);
  }
  return o as T;
}
