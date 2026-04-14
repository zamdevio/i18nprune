import { collectStringLeaves, setAtPath, getAtPath } from '@/core/json/index.js';
import { isParityExcluded } from '@/core/parity/index.js';
import { isPreservePath } from '@/core/preserve/index.js';
import { translateLeaf } from '@/core/translator/index.js';
import type { StringLeaf } from '@/types/core/json/index.js';
import type { Translator } from '@/types/core/translator/index.js';
import type { ParityPolicy, PreservePolicy } from '@/types/config/index.js';

/**
 * Walk source leaves: preserve / parity rules, then translate or copy into `working` object.
 */
export async function buildTranslatedLocaleFromSourceLeaves(input: {
  sourceLeaves: readonly StringLeaf[];
  working: unknown;
  existingRaw: unknown | null;
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
  dryRun: boolean;
  force: boolean;
  provider: Translator;
  targetLang: string;
  tickProgress: (index: number, total: number, path: string) => void;
  onTranslatedLeaf?: (sourceText: string, translatedText: string, path: string) => Promise<void> | void;
}): Promise<{ working: unknown; preserveCount: number; paritySkip: number }> {
  let working = input.working;
  let preserveCount = 0;
  let paritySkip = 0;
  const total = input.sourceLeaves.length;
  let i = 0;

  for (const leaf of input.sourceLeaves) {
    i += 1;
    if (isPreservePath(leaf.path, input.preserve)) {
      working = setAtPath(working, leaf.path, leaf.value);
      preserveCount += 1;
      input.tickProgress(i, total, leaf.path);
      continue;
    }
    if (isParityExcluded(leaf.path, leaf.value, input.parity)) {
      const cur =
        input.existingRaw && typeof input.existingRaw === 'object'
          ? getAtPath(input.existingRaw, leaf.path)
          : undefined;
      const v = typeof cur === 'string' ? cur : leaf.value;
      working = setAtPath(working, leaf.path, v);
      paritySkip += 1;
      input.tickProgress(i, total, leaf.path);
      continue;
    }
    let nextVal: string;
    if (input.dryRun) {
      nextVal = leaf.value;
    } else if (input.existingRaw && !input.force && typeof input.existingRaw === 'object') {
      const cur = getAtPath(input.existingRaw, leaf.path);
      if (typeof cur === 'string' && cur !== leaf.value) {
        nextVal = cur;
        input.tickProgress(i, total, leaf.path);
        working = setAtPath(working, leaf.path, nextVal);
        continue;
      }
      nextVal = await translateLeaf(input.provider, leaf.value, 'en', input.targetLang, {
        onTranslated: async (sourceText, translatedText) => {
          await input.onTranslatedLeaf?.(sourceText, translatedText, leaf.path);
        },
      });
    } else {
      nextVal = await translateLeaf(input.provider, leaf.value, 'en', input.targetLang, {
        onTranslated: async (sourceText, translatedText) => {
          await input.onTranslatedLeaf?.(sourceText, translatedText, leaf.path);
        },
      });
    }
    working = setAtPath(working, leaf.path, nextVal);
    input.tickProgress(i, total, leaf.path);
  }

  return { working, preserveCount, paritySkip };
}

/** Re-scan paths that still exist after deletes (cleanup helper). */
export function localeJsonHasKeyPath(data: unknown, keyPath: string): boolean {
  return collectStringLeaves(data).some((l) => l.path === keyPath);
}
