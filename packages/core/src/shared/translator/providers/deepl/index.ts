import type { Translator } from '../../../../types/translator/index.js';
import { bcp47PrimarySubtag } from '../../utils/pipeline.js';

export function parseDeepLTranslateResponse(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const o = json as { translations?: unknown };
  const list = o.translations;
  if (!Array.isArray(list) || list.length === 0) return '';
  const first = list[0];
  if (!first || typeof first !== 'object') return '';
  const text = (first as { text?: unknown }).text;
  return typeof text === 'string' ? text : '';
}

function deeplOriginForKey(apiKey: string): string {
  return apiKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
}

export type DeeplTranslatorOptions = {
  apiKey: string;
};

/**
 * DeepL REST **`/v2/translate`** (official). Uses global **`fetch`**.
 * Free-plan keys end with **`:fx`** → **`api-free.deepl.com`**; otherwise **`api.deepl.com`**.
 */
export function createDeeplTranslator(opts: DeeplTranslatorOptions): Translator {
  const apiKey = opts.apiKey.trim();
  const origin = deeplOriginForKey(apiKey);
  return {
    async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
      const tl = bcp47PrimarySubtag(targetLang).toUpperCase();
      const sl = bcp47PrimarySubtag(sourceLang).toUpperCase();
      const body = new URLSearchParams({ text, target_lang: tl });
      body.set('source_lang', sl);
      const url = `${origin}/v2/translate`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      if (!res.ok) {
        let detail = `DeepL HTTP ${String(res.status)}`;
        try {
          const errJson: unknown = await res.json();
          if (errJson && typeof errJson === 'object' && 'message' in errJson) {
            const m = (errJson as { message?: unknown }).message;
            if (typeof m === 'string' && m.trim()) detail = m.trim();
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const json: unknown = await res.json();
      return parseDeepLTranslateResponse(json);
    },
  };
}
