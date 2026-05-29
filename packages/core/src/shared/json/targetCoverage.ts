import { collectTranslationSurfaceLeaves } from '../locales/leaves/index.js';
import type { TranslationSurfaceLeaf } from '../../types/locales/leaves/translationSurface.js';

/** True when every source string path exists in `targetRaw`. */
export function targetLocaleCoversAllSourcePaths(sourceRaw: unknown, targetRaw: unknown): boolean {
  const sLeaves = collectTranslationSurfaceLeaves(sourceRaw);
  return targetLocaleCoversAllSourceLeaves(sLeaves, targetRaw);
}

/** True when every source leaf path exists in `targetRaw` (multi-segment source safe). */
export function targetLocaleCoversAllSourceLeaves(
  sourceLeaves: readonly Pick<TranslationSurfaceLeaf, 'path'>[],
  targetRaw: unknown,
): boolean {
  const tLeaves = collectTranslationSurfaceLeaves(targetRaw);
  const targetSet = new Set(tLeaves.map((l) => l.path));
  return sourceLeaves.every((l) => targetSet.has(l.path));
}
