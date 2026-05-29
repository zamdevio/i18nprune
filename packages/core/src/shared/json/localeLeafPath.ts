import { deepClone } from './clone.js';
import { deleteAtPath, getAtPath, setAtPath } from './path.js';

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** True when an object key is a literal dotted path segment (e.g. `"app.title"`). */
export function isLiteralDottedObjectKey(key: string): boolean {
  return key.includes('.');
}

/** Read a leaf path from locale JSON (supports dotted top-level keys, e.g. `"app.title"`). */
export function getLocaleLeafAtPath(root: unknown, pathStr: string): unknown {
  if (isPlainObject(root) && Object.prototype.hasOwnProperty.call(root, pathStr)) {
    return root[pathStr];
  }
  return getAtPath(root, pathStr);
}

export function hasLocaleLeafAtPath(root: unknown, pathStr: string): boolean {
  return getLocaleLeafAtPath(root, pathStr) !== undefined;
}

/** Write a leaf path using canonical nested nesting (never literal dotted top-level keys). */
export function setLocaleLeafAtPath(root: unknown, pathStr: string, value: unknown): unknown {
  return setAtPath(root, pathStr, value);
}

/** Delete a leaf path from locale JSON (supports dotted top-level keys). */
export function deleteLocaleLeafAtPath(root: unknown, pathStr: string): unknown {
  if (isPlainObject(root) && Object.prototype.hasOwnProperty.call(root, pathStr)) {
    const clone = deepClone(root);
    delete clone[pathStr];
    return clone;
  }
  return deleteAtPath(root, pathStr);
}

function stripLiteralDottedKeysAtLevel(root: unknown): unknown {
  if (!isPlainObject(root)) {
    if (Array.isArray(root)) return root.map((item) => stripLiteralDottedKeysAtLevel(item));
    return root;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(root)) {
    if (isLiteralDottedObjectKey(key)) continue;
    out[key] = stripLiteralDottedKeysAtLevel(value);
  }
  return out;
}

/**
 * Normalize locale JSON to canonical nested shape.
 *
 * Literal dotted keys (e.g. `"app.title"`) are promoted to nested paths. When both a dotted key
 * and a nested path exist for the same logical leaf, the dotted value wins. All literal dotted
 * keys are removed from the output.
 */
export function normalizeLocaleDocumentToNestedCanonical(
  root: unknown,
  knownLeafPaths?: readonly string[],
): unknown {
  if (Array.isArray(root)) {
    return root.map((item) => normalizeLocaleDocumentToNestedCanonical(item, knownLeafPaths));
  }
  if (!isPlainObject(root)) return root;

  const preservedNested: Record<string, unknown> = {};
  const dottedAssignments: Array<{ path: string; value: unknown }> = [];

  for (const [key, value] of Object.entries(root)) {
    if (isLiteralDottedObjectKey(key)) {
      dottedAssignments.push({ path: key, value });
    } else {
      preservedNested[key] = normalizeLocaleDocumentToNestedCanonical(value, knownLeafPaths);
    }
  }

  let result: unknown = preservedNested;
  for (const { path, value } of dottedAssignments) {
    result = setAtPath(result, path, deepClone(value));
  }

  if (knownLeafPaths) {
    for (const leafPath of knownLeafPaths) {
      if (
        isLiteralDottedObjectKey(leafPath) &&
        isPlainObject(result) &&
        Object.prototype.hasOwnProperty.call(result, leafPath)
      ) {
        result = deleteLocaleLeafAtPath(result, leafPath);
      }
    }
  }

  return stripLiteralDottedKeysAtLevel(result);
}
