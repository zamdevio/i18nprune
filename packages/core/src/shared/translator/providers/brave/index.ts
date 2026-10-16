import type { Translator } from '../../../../types/translator/index.js';

/**
 * Shared Brave Translate **widget key**.
 *
 * ⚠️ **Unofficial.** This is the key Brave's own `te_lib` translate client embeds in web pages
 * (the same value observed across Brave desktop and iOS). It is a **public widget key**, not a
 * per-user secret, and Brave validates it at their edge (`403` otherwise). Brave may **rotate or
 * block** it at any time — when that happens, override it via **`I18NPRUNE_TRANSLATE_BRAVE_KEY`**
 * or the **`brave`** `translate.providers` row `key`, and see `docs/config/translate.md` for how
 * to read the current value from your browser's DevTools.
 */
export const BRAVE_TRANSLATE_DEFAULT_KEY = 'qztbjzBqJueQZLFkwTTJrieu8Vw3789u';

const BRAVE_TRANSLATE_ENDPOINT = 'https://translate.brave.com/translate_a/t';

/**
 * Brave's `translate_a/t` output is HTML-escaped (the widget injects translated HTML): a bare
 * `&`, `<`, or `>` in the source comes back as `&amp;` / `&lt;` / `&gt;`. i18n locale files want
 * plain text (same contract as the `google` gtx backend), so decode the standard set here.
 * `&amp;` is decoded **last** so `&amp;lt;` collapses to `&lt;`, not `<`.
 */
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeCodePoint(raw: string, radix: number): string {
  const n = Number.parseInt(raw, radix);
  if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return '';
  try {
    return String.fromCodePoint(n);
  } catch {
    return '';
  }
}

export function decodeBraveEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h: string) => decodeCodePoint(h, 16))
    .replace(/&#(\d+);/g, (_m, d: string) => decodeCodePoint(d, 10))
    .replace(/&(lt|gt|quot|apos);/g, (_m, n: string) => NAMED_ENTITIES[n] ?? '')
    .replace(/&amp;/g, '&');
}

/**
 * Brave `translate_a/t` JSON → one string.
 *
 * The endpoint returns a flat array of translated segments (`["Gaari"]`); the nested-array branch
 * is defensive only. HTML entities are decoded via {@link decodeBraveEntities}.
 */
export function parseBraveResponse(json: unknown): string {
  if (!Array.isArray(json)) return '';
  const parts: string[] = [];
  for (const entry of json) {
    if (typeof entry === 'string') parts.push(entry);
    else if (Array.isArray(entry) && typeof entry[0] === 'string') parts.push(entry[0]);
  }
  return decodeBraveEntities(parts.join(''));
}

export type BraveTranslatorOptions = {
  /** Widget key override; falls back to {@link BRAVE_TRANSLATE_DEFAULT_KEY} when omitted. */
  key?: string;
};

/**
 * Brave Translate — an **unofficial**, Google-Website-Translator-compatible `public_http` backend.
 *
 * `POST`s a form-encoded `q` to Brave's edge with the shared widget key. No `tk` token is required
 * (verified against the live endpoint). Uses global **`fetch`** (Node 18+).
 */
export function createBraveTranslator(opts: BraveTranslatorOptions = {}): Translator {
  const key = opts.key?.trim() ?? BRAVE_TRANSLATE_DEFAULT_KEY;
  return {
    async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
      const params = new URLSearchParams({
        anno: '3',
        client: 'te_lib',
        format: 'html',
        v: '1.0',
        logld: 'vTE_20220615',
        sl: sourceLang,
        tl: targetLang,
        tc: '5',
        sr: '1',
        mode: '1',
        key,
      });
      const url = `${BRAVE_TRANSLATE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ q: text }).toString(),
      });
      if (!res.ok) {
        throw new Error(`Brave translate HTTP ${String(res.status)}`);
      }
      const json: unknown = await res.json();
      return parseBraveResponse(json);
    },
  };
}
