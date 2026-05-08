import type { Translator } from '../../../../types/translator/index.js';
import type { TranslationLeafMetaPatch, TranslationProviderYield } from '../../../../types/translator/result.js';
import { bcp47PrimarySubtag } from '../../utils/pipeline.js';

export function parseMyMemoryTranslation(json: unknown): TranslationProviderYield {
  if (!json || typeof json !== 'object') return { text: '' };
  const o = json as Record<string, unknown>;
  const status = o.responseStatus;
  if (typeof status === 'number' && status !== 200) {
    const detail =
      typeof o.responseDetails === 'string' && o.responseDetails.trim() !== ''
        ? o.responseDetails
        : `MyMemory responseStatus ${String(status)}`;
    throw new Error(detail);
  }
  const rd = o.responseData;
  if (!rd || typeof rd !== 'object') return { text: '' };
  const text = (rd as { translatedText?: unknown }).translatedText;
  const translated = typeof text === 'string' ? text : '';
  const matchRaw = (rd as { match?: unknown }).match;
  const leafMeta: TranslationLeafMetaPatch | undefined =
    typeof matchRaw === 'number' && Number.isFinite(matchRaw)
      ? {
          status: 'translated',
          confidence: Math.max(0, Math.min(1, matchRaw)),
          needsReview: matchRaw < 0.85,
          needsTranslationAgain: matchRaw < 0.5,
          source: 'mymemory',
        }
      : undefined;
  return leafMeta !== undefined ? { text: translated, leafMeta } : { text: translated };
}

export type MymemoryTranslatorOptions = {
  /** Optional contact email — raises MyMemory daily quota (documented by MyMemory). */
  contactEmail?: string;
};

/**
 * [MyMemory](https://mymemory.translated.net/doc) public `get` API — no API key.
 * Uses global **`fetch`** (Node 18+). Supplies **`leafMeta`** from **`responseData.match`** when present.
 */
export function createMymemoryTranslator(opts: MymemoryTranslatorOptions = {}): Translator {
  const email = opts.contactEmail?.trim();
  return {
    async translate(text: string, sourceLang: string, targetLang: string): Promise<string | TranslationProviderYield> {
      const sl = bcp47PrimarySubtag(sourceLang);
      const tl = bcp47PrimarySubtag(targetLang);
      const params = new URLSearchParams({ q: text, langpair: `${sl}|${tl}` });
      if (email) params.set('de', email);
      const url = `https://api.mymemory.translated.net/get?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        // MyMemory returns JSON with a useful `responseDetails` message for quota/rate limiting.
        try {
          const json: unknown = await res.json();
          const details =
            json && typeof json === 'object' && typeof (json as { responseDetails?: unknown }).responseDetails === 'string'
              ? (json as { responseDetails: string }).responseDetails
              : undefined;
          if (details && details.trim() !== '') {
            throw new Error(`MyMemory HTTP ${String(res.status)}: ${details.trim()}`);
          }
        } catch (e) {
          // If parsing fails, fall through to a simple status error.
          if (e instanceof Error && /MyMemory HTTP/.test(e.message)) throw e;
        }
        throw new Error(`MyMemory HTTP ${String(res.status)}`);
      }
      const json: unknown = await res.json();
      return parseMyMemoryTranslation(json);
    },
  };
}
