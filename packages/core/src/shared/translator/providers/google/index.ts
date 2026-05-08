import type { Translator } from '../../../../types/translator/index.js';

/** `translate_a/single` JSON → one string (joins every segment’s `[0]`). */
export function parseGtxResponse(json: unknown): string {
  if (!Array.isArray(json) || json.length === 0) return '';
  const first = json[0];
  if (!Array.isArray(first)) return '';
  const parts: string[] = [];
  for (const seg of first) {
    if (Array.isArray(seg) && typeof seg[0] === 'string') {
      parts.push(seg[0]);
    }
  }
  return parts.join('');
}

/**
 * Unofficial `client=gtx` endpoint; for production consider Cloud Translation API.
 * Uses global **`fetch`** (Node 18+).
 */
export function createGoogleTranslator(): Translator {
  return {
    async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
      const params = new URLSearchParams({
        client: 'gtx',
        sl: sourceLang,
        tl: targetLang,
        dt: 't',
        q: text,
      });
      const url = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google translate HTTP ${String(res.status)}`);
      }
      const json: unknown = await res.json();
      return parseGtxResponse(json);
    },
  };
}
