import { describe, expect, it } from 'vitest';
import { runProjectReadiness } from '../run.js';
import type { CoreContext } from '../../../types/generate/index.js';
import { ISSUE_PROJECT_CONFIG_FILE_MISSING, ISSUE_PROJECT_SRC_ROOT_UNAVAILABLE } from '../../../shared/constants/issueCodes.js';

function ctxWithFs(fs: CoreContext['adapters']['fs']): CoreContext {
  return {
    config: {
      functions: [],
      exclude: [],
      locales: { source: 'locales/en.json', directory: 'locales' },
      src: 'src',
    } as CoreContext['config'],
    adapters: {
      fs,
      path: { basename: (p: string, ext?: string) => (ext ? p.replace(ext, '') : p) } as CoreContext['adapters']['path'],
      system: { cwd: () => '/proj' },
    } as CoreContext['adapters'],
    env: {} as CoreContext['env'],
    paths: {
      sourceLocale: '/proj/locales/en.json',
      localesDir: '/proj/locales',
      srcRoot: '/proj/src',
    },
  } as unknown as CoreContext;
}

describe('runProjectReadiness', () => {
  it('custom mode: flags missing src root', () => {
    const fs = {
      exists: () => false,
      readText: () => '',
      statKind: () => 'missing' as const,
      listDir: () => [],
      writeText: () => {},
      deleteFile: () => {},
      mkdirp: () => {},
    };
    const out = runProjectReadiness(ctxWithFs(fs), {
      mode: 'custom',
      checks: { srcRootDirectory: true },
    });
    expect(out.ok).toBe(false);
    expect(out.issues.some((i) => i.code === ISSUE_PROJECT_SRC_ROOT_UNAVAILABLE)).toBe(true);
  });

  it('preset validate uses validate source issue code when source file missing', () => {
    const fs = {
      exists: (p: string) => p.endsWith('en.json') === false,
      readText: () => '',
      statKind: (p: string) => (p.endsWith('en.json') ? 'missing' : 'directory'),
      listDir: () => [],
      writeText: () => {},
      deleteFile: () => {},
      mkdirp: () => {},
    };
    const out = runProjectReadiness(ctxWithFs(fs), { mode: 'preset', preset: 'validate' });
    expect(out.ok).toBe(false);
    expect(out.issues[0]?.code).toBe('i18nprune.validate.source_locale_unreadable');
  });

  it('emits project config_file_missing when configFileLoaded is false and check enabled', () => {
    const fs = {
      exists: () => true,
      readText: () => '{}',
      statKind: () => 'file' as const,
      listDir: () => [],
      writeText: () => {},
      deleteFile: () => {},
      mkdirp: () => {},
    };
    const ctx = { ...ctxWithFs(fs), configFileLoaded: false } as CoreContext;
    const out = runProjectReadiness(ctx, { mode: 'custom', checks: { configFilePresent: true } });
    expect(out.ok).toBe(false);
    expect(out.issues).toHaveLength(1);
    expect(out.issues[0]?.code).toBe(ISSUE_PROJECT_CONFIG_FILE_MISSING);
  });
});
