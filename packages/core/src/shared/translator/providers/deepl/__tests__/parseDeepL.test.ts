import { describe, expect, it } from 'vitest';
import { parseDeepLTranslateResponse } from '../index.js';

describe('parseDeepLTranslateResponse', () => {
  it('reads first translation text', () => {
    const json = { translations: [{ detected_source_language: 'EN', text: 'Hello' }] };
    expect(parseDeepLTranslateResponse(json)).toBe('Hello');
  });
});
