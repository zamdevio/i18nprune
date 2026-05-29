import { setAtPath } from '../shared/json/path.js';

export function applyMissingPaths(input: {
  localeJson: unknown;
  paths: readonly string[];
  placeholder: string;
}): unknown {
  let next: unknown = input.localeJson;
  for (const path of input.paths) {
    next = setAtPath(next, path, input.placeholder);
  }
  return next;
}
