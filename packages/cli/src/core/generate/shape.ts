import { collectStringLeaves } from '@/core/json/index.js';
import { normalizeLanguageCode } from '@/core/languages/index.js';

/** True when every source string path exists in `targetRaw`. */
export function targetLocaleCoversAllSourcePaths(sourceRaw: unknown, targetRaw: unknown): boolean {
  const sLeaves = collectStringLeaves(sourceRaw);
  const tLeaves = collectStringLeaves(targetRaw);
  const targetSet = new Set(tLeaves.map((l) => l.path));
  return sLeaves.every((l) => targetSet.has(l.path));
}

export function normalizeGeneratePromptLang(raw: string): string {
  return normalizeLanguageCode(raw);
}
