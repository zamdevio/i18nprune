import { deleteLocaleLeafAtPath, hasLocaleLeafAtPath } from '../shared/json/localeLeafPath.js';

/**
 * Pure cleanup application: remove candidate key paths from one locale JSON object.
 */
export function applyCleanupKeysToLocaleJson(
  localeJson: unknown,
  keysToRemove: readonly string[],
): { next: unknown; removedPaths: string[] } {
  let next = localeJson;
  const removedPaths: string[] = [];
  for (const key of keysToRemove) {
    if (hasLocaleLeafAtPath(next, key)) {
      next = deleteLocaleLeafAtPath(next, key);
      removedPaths.push(key);
    }
  }
  return { next, removedPaths };
}
