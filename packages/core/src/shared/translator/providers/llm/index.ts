import type { Translator } from '../../../../types/translator/index.js';
import { assertLlmOutputPreservesPlaceholders } from './placeholders.js';

const SYSTEM_PROMPT = `You translate user-interface strings for software localization.

Strict rules:
- Copy every placeholder token exactly as in the source. Tokens look like __I18NPRUNE_Q_0__, __I18NPRUNE_B_1__, etc. They MUST appear unchanged in your output.
- Do not wrap the entire string in quotes unless the source already does.
- Reply with the translated text only — no preamble, markdown fences, or explanation.`;

export function parseOpenAiChatCompletionContent(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const o = json as { choices?: unknown };
  const choices = o.choices;
  if (!Array.isArray(choices) || choices.length === 0) return '';
  const first = choices[0];
  if (!first || typeof first !== 'object') return '';
  const msg = (first as { message?: unknown }).message;
  if (!msg || typeof msg !== 'object') return '';
  const content = (msg as { content?: unknown }).content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const part of content) {
      if (part && typeof part === 'object' && 'text' in part) {
        const t = (part as { text?: unknown }).text;
        if (typeof t === 'string') parts.push(t);
      }
    }
    return parts.join('');
  }
  return '';
}

export type LlmTranslatorOptions = {
  apiKey: string;
  /** OpenAI-style API root including /v1, e.g. https://api.openai.com/v1 */
  baseUrl: string;
  model: string;
};

/**
 * OpenAI-compatible **`POST …/chat/completions`**. Uses global **`fetch`**.
 * Masked placeholders are preserved by the shared **`translateLeaf`** pipeline; the model is instructed not to alter **`__I18NPRUNE_*`** tokens.
 */
export function createLlmTranslator(opts: LlmTranslatorOptions): Translator {
  const apiKey = opts.apiKey.trim();
  const model = opts.model.trim();
  const base = opts.baseUrl.trim().replace(/\/+$/, '');
  return {
    async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
      const url = `${base}/chat/completions`;
      const body = {
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Source language tag: ${sourceLang}\nTarget language tag: ${targetLang}\n\nText to translate:\n\n${text}`,
          },
        ],
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let detail = `LLM HTTP ${String(res.status)}`;
        try {
          const errJson: unknown = await res.json();
          if (errJson && typeof errJson === 'object' && 'error' in errJson) {
            const err = (errJson as { error?: unknown }).error;
            if (err && typeof err === 'object' && 'message' in err) {
              const m = (err as { message?: unknown }).message;
              if (typeof m === 'string' && m.trim()) detail = m.trim();
            }
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const json: unknown = await res.json();
      const out = parseOpenAiChatCompletionContent(json);
      assertLlmOutputPreservesPlaceholders(text, out);
      return out;
    },
  };
}
