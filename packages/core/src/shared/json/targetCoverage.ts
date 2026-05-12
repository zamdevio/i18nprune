import { collectTranslationSurfaceLeaves } from '../localeLeaves/translationSurfaceWalk.js';

/** True when every source string path exists in `targetRaw`. */
export function targetLocaleCoversAllSourcePaths(sourceRaw: unknown, targetRaw: unknown): boolean {
  const sLeaves = collectTranslationSurfaceLeaves(sourceRaw);
  const tLeaves = collectTranslationSurfaceLeaves(targetRaw);
  const targetSet = new Set(tLeaves.map((l) => l.path));
  return sLeaves.every((l) => targetSet.has(l.path));
}
