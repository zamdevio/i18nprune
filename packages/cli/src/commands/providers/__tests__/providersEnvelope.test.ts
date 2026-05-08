import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '@i18nprune/core/config';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { runProviders } from '../jsonEnvelope.js';
import type { Context } from '@/types/core/context/index.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';

function makeContext(): Context {
  return {
    config: DEFAULT_CONFIG as I18nPruneConfig,
    paths: {
      sourceLocale: '/tmp/en.json',
      localesDir: '/tmp/locales',
      srcRoot: '/tmp/src',
    },
    run: { json: true, jsonPretty: true, quiet: false, silent: false, debugScan: false },
    meta: {
      fieldSources: {},
      warnings: [],
      cache: {
        enabled: false,
        reason: 'default',
        rootDir: '',
        metaPath: '',
        projectId: '',
        projectRoot: '/tmp',
        projectDir: '',
        filesPath: '',
        runPath: '',
      },
    },
    adapters: createNodeRuntimeAdapters(),
  };
}

describe('runProviders', () => {
  it('returns envelope with providers and merge text', () => {
    const env = runProviders(makeContext());
    expect(env.ok).toBe(true);
    expect(env.kind).toBe('providers');
    expect(env.data.providers.length).toBeGreaterThanOrEqual(5);
    expect(env.data.mergePrecedence).toContain('I18NPRUNE_TRANSLATE_PROVIDER');
    expect(env.data.configSnippets.google).toContain('google');
  });
});
