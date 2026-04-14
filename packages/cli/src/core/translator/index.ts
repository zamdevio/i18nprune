import { mask, restore, validateRestored } from '@/core/placeholders/index.js';
import type { Translator } from '@/types/core/translator/index.js';

const DEFAULT_DELAYS = [400, 900];

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/** Placeholder-safe translate: mask → provider → restore → validate; shared by commands. */
export async function translateLeaf(
  provider: Translator,
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  options?: { onTranslated?: (sourceText: string, translatedText: string) => Promise<void> | void },
): Promise<string> {
  const { text, originals } = mask(sourceText);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const out = await provider.translate(text, sourceLang, targetLang);
      const restored = restore(out, originals);
      validateRestored(sourceText, restored, originals);
      await options?.onTranslated?.(sourceText, restored);
      return restored;
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await sleep(DEFAULT_DELAYS[attempt] ?? 500);
    }
  }
  throw lastErr;
}
