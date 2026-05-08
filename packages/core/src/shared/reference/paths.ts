/**
 * True when `keyPath` is exactly `prefix` or nested under it (dot or bracket segments).
 * Used for uncertain key prefixes from template partials / dynamic `resolvedPrefix`.
 */
export function pathUnderUncertainPrefix(keyPath: string, prefix: string): boolean {
  if (keyPath === prefix) return true;
  if (keyPath.startsWith(`${prefix}.`)) return true;
  if (keyPath.startsWith(`${prefix}[`)) return true;
  return false;
}

export function pathUnderAnyUncertainPrefix(keyPath: string, prefixes: readonly string[]): boolean {
  for (const p of prefixes) {
    if (pathUnderUncertainPrefix(keyPath, p)) return true;
  }
  return false;
}
