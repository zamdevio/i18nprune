import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { resolveCleanupTargetLocaleCodes } from '../resolveTargets.js';

function flatLocaleContext(codes: readonly string[]): ReturnType<typeof createCoreContext> {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cleanup-targets-'));
  const localesDir = path.join(root, 'locales');
  fs.mkdirSync(localesDir, { recursive: true });
  for (const code of codes) {
    fs.writeFileSync(path.join(localesDir, `${code}.json`), JSON.stringify({ hello: code }));
  }
  const sourcePath = path.join(localesDir, 'en.json');
  const config = parseI18nPruneConfig({
    locales: { source: 'en', directory: 'locales' },
    src: 'src',
    functions: ['t'],
  });
  return createCoreContext({
    config,
    adapters: createNodeRuntimeAdapters(),
    env: {},
    paths: { sourceLocale: sourcePath, localesDir, srcRoot: path.join(root, 'src') },
  });
}

describe('resolveCleanupTargetLocaleCodes', () => {
  it('parses comma-separated target codes', () => {
    const ctx = flatLocaleContext(['en', 'ja', 'ms', 'pt']);
    expect(resolveCleanupTargetLocaleCodes(ctx, 'ja,ms,pt')).toEqual({
      localeCodes: ['ja', 'ms', 'pt'],
      skippedTargets: [],
    });
  });

  it('resolves all to every non-source target with locale files', () => {
    const ctx = flatLocaleContext(['en', 'ja', 'so']);
    expect(resolveCleanupTargetLocaleCodes(ctx, 'all')).toEqual({
      localeCodes: ['ja', 'so'],
      skippedTargets: [],
    });
  });

  it('skips source locale and unknown targets', () => {
    const ctx = flatLocaleContext(['en', 'ja']);
    expect(resolveCleanupTargetLocaleCodes(ctx, 'en,ja,zz')).toEqual({
      localeCodes: ['ja'],
      skippedTargets: [
        { localeCode: 'en', reason: 'source_locale' },
        { localeCode: 'zz', reason: 'not_found' },
      ],
    });
  });

  it('suggests close locale codes for typos', () => {
    const ctx = flatLocaleContext(['en', 'ja', 'zh-cn']);
    expect(resolveCleanupTargetLocaleCodes(ctx, 'zh-ch')).toEqual({
      localeCodes: [],
      skippedTargets: [{ localeCode: 'zh-ch', reason: 'not_found', suggestions: ['zh-cn'] }],
    });
  });
});
