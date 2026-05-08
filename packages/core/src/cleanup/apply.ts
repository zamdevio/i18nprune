import { deleteAtPath, getAtPath } from '../shared/json/path.js';

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
    if (getAtPath(next, key) !== undefined) {
      next = deleteAtPath(next, key);
      removedPaths.push(key);
    }
  }
  return { next, removedPaths };
}
