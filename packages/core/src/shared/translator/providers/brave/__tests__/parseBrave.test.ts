import { describe, it, expect } from 'vitest';
import { parseBraveResponse, decodeBraveEntities, BRAVE_TRANSLATE_DEFAULT_KEY } from '../index.js';

describe('parseBraveResponse', () => {
  it('reads a single flat segment', () => {
    expect(parseBraveResponse(['Gaari'])).toBe('Gaari');
  });

  it('joins multiple flat segments', () => {
    expect(parseBraveResponse(['Guriga', 'Gaari', 'Ey'])).toBe('GurigaGaariEy');
  });

  it('is defensive about nested segments', () => {
    expect(parseBraveResponse([['Hello'], null])).toBe('Hello');
  });

  it('returns empty string for non-arrays', () => {
    expect(parseBraveResponse(null)).toBe('');
    expect(parseBraveResponse({})).toBe('');
  });

  it('decodes HTML entities the endpoint emits', () => {
    expect(parseBraveResponse(['a &gt; b &amp; c'])).toBe('a > b & c');
    expect(parseBraveResponse(['Fish &amp; Chips &lt;3'])).toBe('Fish & Chips <3');
  });
});

describe('decodeBraveEntities', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeBraveEntities('&lt;')).toBe('<');
    expect(decodeBraveEntities('&gt;')).toBe('>');
    expect(decodeBraveEntities('&quot;')).toBe('"');
    expect(decodeBraveEntities('&apos;')).toBe("'");
    expect(decodeBraveEntities('&#39;')).toBe("'");
    expect(decodeBraveEntities('&#x41;')).toBe('A');
  });

  it('does not double-decode &amp;lt;', () => {
    expect(decodeBraveEntities('&amp;lt;')).toBe('&lt;');
  });
});

describe('BRAVE_TRANSLATE_DEFAULT_KEY', () => {
  it('is a non-empty shared widget key', () => {
    expect(BRAVE_TRANSLATE_DEFAULT_KEY.length).toBeGreaterThan(0);
  });
});
