import { describe, expect, it } from 'vitest';
import { buildTranslationProvidersPayload } from '../../utils/helpPayload.js';

describe('buildTranslationProvidersPayload', () => {
  it('includes all provider ids and snippets', () => {
    const p = buildTranslationProvidersPayload();
    const ids = p.providers.map((x) => x.id).sort().join(',');
    expect(ids).toContain('google');
    expect(ids).toContain('llm');
    expect(p.configSnippets.libre).toContain('libre');
    expect(p.mergePrecedence).toContain('I18NPRUNE_TRANSLATE_PROVIDER');
  });
});
