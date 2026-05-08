import { describe, expect, it } from 'vitest';
import { parseLibreTranslateResponse } from '../index.js';

describe('parseLibreTranslateResponse', () => {
  it('reads translatedText', () => {
    expect(parseLibreTranslateResponse({ translatedText: 'Bonjour' })).toBe('Bonjour');
  });
});
