import type { CacheHashText } from '../types/cache/index.js';
import type { RuntimePathPort } from '../types/runtime/index.js';

function fallbackHashText(text: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
}

function normalizeProjectRoot(projectRoot: string, pathPort?: Pick<RuntimePathPort, 'resolve'>): string {
  const resolved = pathPort ? pathPort.resolve(projectRoot) : projectRoot;
  return resolved.replace(/\\/g, '/').toLowerCase();
}

/** Stable project id from a normalized project root path. */
export function computeCacheProjectId(
  projectRoot: string,
  input: { path?: Pick<RuntimePathPort, 'resolve'>; hashText?: CacheHashText } = {},
): string {
  return (input.hashText ?? fallbackHashText)(normalizeProjectRoot(projectRoot, input.path)).slice(0, 16);
}

/** Content hash helper for file-level cache records. */
export function computeCacheContentHash(text: string, hashText?: CacheHashText): string {
  return (hashText ?? fallbackHashText)(text);
}
