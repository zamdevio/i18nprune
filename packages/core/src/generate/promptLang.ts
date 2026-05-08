import { normalizeLanguageCode } from '../shared/languages/normalize.js';

/** Normalize user input for generate target language prompts (same rules as catalog codes). */
export function normalizeGeneratePromptLang(raw: string): string {
  return normalizeLanguageCode(raw);
}
