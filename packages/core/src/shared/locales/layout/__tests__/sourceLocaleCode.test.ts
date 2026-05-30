import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../../runtime/exports/node.js';
import { resolveLocalesLayout, sourceLocaleCodeForLayout } from '../index.js';

describe('sourceLocaleCodeForLayout', () => {
  const rt = createNodeRuntimeAdapters();

  it('returns locale directory code for locale_per_dir source segment', () => {
    const root = '/proj/messages';
    const layout = resolveLocalesLayout(
      {
        source: 'en',
        directory: 'messages',
        mode: 'locale_directory',
        structure: 'locale_per_dir',
      },
      root,
    );
    expect(
      sourceLocaleCodeForLayout({
        layout,
        path: rt.path,
        sourceLocaleAbsolute: `${root}/en/app.json`,
      }),
    ).toBe('en');
  });

  it('returns basename for flat_file source', () => {
    const root = '/proj/locales';
    const layout = resolveLocalesLayout(
      { source: 'en', directory: 'locales', mode: 'flat_file', structure: 'locale_file' },
      root,
    );
    expect(
      sourceLocaleCodeForLayout({
        layout,
        path: rt.path,
        sourceLocaleAbsolute: `${root}/en.json`,
      }),
    ).toBe('en');
  });
});
