import { describe, expect, it } from 'vitest';
import { discoverLocaleTagsFromTextFiles } from '../prepare/discoverLocaleTags.js';

describe('discoverLocaleTagsFromTextFiles', () => {
  it('collects flat_file locale basenames under localesDir', () => {
    const tags = discoverLocaleTagsFromTextFiles({
      textFiles: {
        'locales/en.json': '{}',
        'locales/fr.json': '{}',
        'src/a.ts': 'x',
      },
      localesDir: 'locales',
      sourceLocalePath: 'locales/en.json',
      localesMode: 'flat_file',
    });
    expect(tags).toEqual(['en', 'fr']);
  });

  it('falls back to source locale code when no locale json paths match', () => {
    const tags = discoverLocaleTagsFromTextFiles({
      textFiles: { 'src/a.ts': 'x' },
      localesDir: 'locales',
      sourceLocalePath: 'locales/en.json',
    });
    expect(tags).toEqual(['en']);
  });
});
