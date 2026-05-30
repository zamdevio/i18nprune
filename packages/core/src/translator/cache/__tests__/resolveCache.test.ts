import { describe, expect, it } from 'vitest';
import { createGenerateTranslateCache, translateCacheL2Enabled } from '../resolveCache.js';
import type { CoreContext } from '../../../types/context/index.js';

function ctx(partial: Partial<NonNullable<CoreContext['cache']>> & { configCacheEnabled?: boolean }): CoreContext {
  const enabled = partial.state?.enabled ?? true;
  return {
    config: {
      locales: { source: 'en', directory: 'locales' },
      src: 'src',
      functions: ['t'],
      translate: { primary: 'google', providers: [{ id: 'google' }] },
      cache: partial.configCacheEnabled === false ? { enabled: false } : {},
    },
    adapters: {} as CoreContext['adapters'],
    env: {},
    paths: { sourceLocale: '/p/locales/en.json', localesDir: '/p/locales', srcRoot: '/p/src' },
    cache: {
      state: {
        enabled,
        reason: partial.state?.reason ?? 'default',
        rootDir: '/cache',
        metaPath: '/cache/meta.json',
        projectId: 'proj',
        projectRoot: '/project',
        projectDir: '/cache/projects/proj',
        filesPath: '/cache/projects/proj/files.json',
        analysisPath: '/cache/projects/proj/analysis.json',
        translationsDir: '/cache/projects/proj/translations',
        readOnly: partial.state?.readOnly ?? false,
      },
      runtime: {
        fs: {} as CoreContext['adapters']['fs'],
        path: {} as CoreContext['adapters']['path'],
        system: { now: () => 0, cwd: () => '/project' },
      },
      baselineFiles: {},
    },
  };
}

describe('translateCacheL2Enabled', () => {
  it('disables L2 when project cache is off', () => {
    expect(translateCacheL2Enabled(ctx({ state: { enabled: false, reason: 'config_disabled' } as never }))).toBe(false);
  });

  it('disables L2 when generate --force bypass is set', () => {
    expect(translateCacheL2Enabled(ctx({}), { bypassL2: true })).toBe(false);
  });
});

describe('createGenerateTranslateCache', () => {
  it('returns L1 when project cache is enabled', () => {
    const out = createGenerateTranslateCache(ctx({}));
    expect(out.cache.l1).toBeDefined();
  });

  it('skips L1 on cli_no_cache', () => {
    const out = createGenerateTranslateCache(ctx({ state: { enabled: false, reason: 'cli_no_cache' } as never }));
    expect(out.cache.l1).toBeUndefined();
  });
});
