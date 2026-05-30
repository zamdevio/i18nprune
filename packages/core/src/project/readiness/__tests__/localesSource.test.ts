import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import type { CoreContext } from '../../../types/context/index.js';
import { runProjectReadiness } from '../run.js';

function ctxWithSource(source: string): CoreContext {
  const adapters = createNodeRuntimeAdapters();
  const root = path.join('/proj');
  return {
    config: {
      locales: { source, directory: 'locales', mode: 'flat_file', structure: 'locale_file' },
      src: 'src',
      functions: ['t'],
    },
    paths: {
      sourceLocale: path.join(root, 'locales', 'en.json'),
      localesDir: path.join(root, 'locales'),
      srcRoot: path.join(root, 'src'),
    },
    adapters,
    configFileLoaded: true,
    meta: { warnings: [] },
  } as unknown as CoreContext;
}

describe('readiness locales.source', () => {
  it('fails when locales.source is a file path', () => {
    const r = runProjectReadiness(ctxWithSource('messages/en/app.json'), {
      mode: 'custom',
      checks: { localesSourceLanguageCode: true },
    });
    expect(r.ok).toBe(false);
    const msg = r.issues.map((i) => i.message).join(' ');
    expect(msg.includes('locales.source')).toBe(true);
    expect(msg.includes('not a file path') || msg.includes('not a supported language code')).toBe(true);
  });

  it('fails when locales.source is unsupported in catalog', () => {
    const r = runProjectReadiness(ctxWithSource('zz'), {
      mode: 'custom',
      checks: { localesSourceLanguageCode: true },
    });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes('not a supported language code'))).toBe(true);
  });
});
