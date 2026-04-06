import { createGoogleTranslator } from '@/providers/google/index.js';
import type { Translator } from '@/types/core/translator/index.js';

export function createTranslator(): Translator {
  return createGoogleTranslator();
}
