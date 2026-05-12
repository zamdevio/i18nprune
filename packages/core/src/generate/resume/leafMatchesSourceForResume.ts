/**
 * Detects when a locale string still matches the **source** string closely enough that a
 * **`generate --resume`** pass should treat it as a stale / untranslated copy (strict equality plus
 * light normalization).
 */
export function leafMatchesSourceForResume(leafValue: string, sourceValue: string): boolean {
  if (leafValue === sourceValue) return true;
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ');
  if (norm(leafValue) === norm(sourceValue)) return true;
  if (leafValue.localeCompare(sourceValue, undefined, { sensitivity: 'base' }) === 0) return true;
  return false;
}
