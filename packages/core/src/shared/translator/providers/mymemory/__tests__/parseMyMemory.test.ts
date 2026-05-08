import { describe, expect, it } from 'vitest';
import { parseMyMemoryTranslation } from '../index.js';

describe('parseMyMemoryTranslation', () => {
  it('reads translatedText on success', () => {
    const json = {
      responseStatus: 200,
      responseData: { translatedText: 'Hola', match: 1 },
    };
    expect(parseMyMemoryTranslation(json).text).toBe('Hola');
  });

  it('includes leafMeta when match is numeric', () => {
    const json = {
      responseStatus: 200,
      responseData: { translatedText: 'Hola', match: 0.9 },
    };
    const y = parseMyMemoryTranslation(json);
    expect(y.text).toBe('Hola');
    expect('leafMeta' in y && y.leafMeta).toBeTruthy();
    expect((y as { leafMeta: { confidence: number } }).leafMeta.confidence).toBe(0.9);
  });

  it('throws on non-200 status', () => {
    const json = { responseStatus: 403, responseDetails: 'blocked' };
    expect(() => parseMyMemoryTranslation(json)).toThrow('blocked');
  });
});
