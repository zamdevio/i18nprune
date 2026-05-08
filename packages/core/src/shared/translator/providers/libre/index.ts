import type { Translator } from '../../../../types/translator/index.js';
import { bcp47PrimarySubtag } from '../../utils/pipeline.js';

export function parseLibreTranslateResponse(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const o = json as { translatedText?: unknown };
  return typeof o.translatedText === 'string' ? o.translatedText : '';
}

export type LibreTranslatorOptions = {
  /** LibreTranslate instance origin, no trailing slash (e.g. `https://libretranslate.com`). */
  baseUrl: string;
};

/**
 * [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) **`POST /translate`** JSON API.
 */
export function createLibreTranslator(opts: LibreTranslatorOptions): Translator {
  const origin = opts.baseUrl.trim().replace(/\/+$/, '');
  return {
    async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
      const source = bcp47PrimarySubtag(sourceLang);
      const target = bcp47PrimarySubtag(targetLang);
      const url = `${origin}/translate`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source, target, format: 'text' }),
      });
      if (!res.ok) {
        throw new Error(`LibreTranslate HTTP ${String(res.status)}`);
      }
      const json: unknown = await res.json();
      return parseLibreTranslateResponse(json);
    },
  };
}
