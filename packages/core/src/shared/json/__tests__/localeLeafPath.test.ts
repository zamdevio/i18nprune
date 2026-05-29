import { describe, expect, it } from 'vitest';
import {
  getLocaleLeafAtPath,
  normalizeLocaleDocumentToNestedCanonical,
  setLocaleLeafAtPath,
} from '../localeLeafPath.js';

describe('normalizeLocaleDocumentToNestedCanonical', () => {
  it('promotes literal dotted keys to nested paths', () => {
    const input = {
      'app.title': 'Titre',
      'app.description': 'Description',
    };
    expect(normalizeLocaleDocumentToNestedCanonical(input)).toEqual({
      app: { title: 'Titre', description: 'Description' },
    });
  });

  it('prefers dotted values over nested duplicates at the same logical path', () => {
    const spanish = {
      value: 'Accesorio',
      status: 'translated',
      confidence: 0.62,
      needsReview: false,
      needsTranslationAgain: false,
      source: 'google-heuristic',
    };
    const englishPending = {
      value: 'Next app dir fixture',
      status: 'pending',
      confidence: null,
      needsReview: true,
      needsTranslationAgain: true,
      source: 'sync',
    };
    const input = {
      'app.title': spanish,
      'app.description': { ...spanish, value: 'Árbol' },
      app: {
        title: englishPending,
        description: { ...englishPending, value: 'App Router-shaped tree' },
      },
    };
    expect(normalizeLocaleDocumentToNestedCanonical(input, ['app.title', 'app.description'])).toEqual({
      app: {
        title: spanish,
        description: { ...spanish, value: 'Árbol' },
      },
    });
  });

  it('never writes literal dotted keys via setLocaleLeafAtPath', () => {
    const out = setLocaleLeafAtPath({}, 'app.title', 'hello');
    expect(out).toEqual({ app: { title: 'hello' } });
    expect(getLocaleLeafAtPath(out, 'app.title')).toBe('hello');
  });
});
