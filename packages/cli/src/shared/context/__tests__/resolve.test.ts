import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ensureConfigPathResolved,
  resetConfigPathResolution,
  setConfigPath,
} from '@/shared/config/index.js';
import {
  clearContextCache,
  resolveContext,
  resetCliGlobals,
  setCliGlobalOverrides,
} from '@/shared/context/index.js';
import { resolveCliCacheState } from '@/shared/cache/paths.js';

describe('resolveContext config-root path resolution', () => {
  let prevCwd: string;
  let cliDir: string;
  let configProjectDir: string;

  beforeEach(() => {
    prevCwd = process.cwd();
    cliDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cli-cwd-'));
    configProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-config-root-'));
    clearContextCache();
    resetConfigPathResolution();
    setConfigPath(undefined);
    resetCliGlobals();
  });

  afterEach(() => {
    process.chdir(prevCwd);
    fs.rmSync(cliDir, { recursive: true, force: true });
    fs.rmSync(configProjectDir, { recursive: true, force: true });
    clearContextCache();
    resetConfigPathResolution();
    setConfigPath(undefined);
    resetCliGlobals();
  });

  it('resolves relative source/locales/src from explicit config file directory', async () => {
    const configPath = path.join(configProjectDir, 'i18nprune.config.ts');
    fs.writeFileSync(
      configPath,
      'export default { source: "locales/en.json", localesDir: "locales", src: "src", functions: ["t"] }',
      'utf8',
    );

    process.chdir(cliDir);
    setConfigPath(configPath);
    await ensureConfigPathResolved(cliDir);
    const ctx = await resolveContext(cliDir);

    expect(ctx.paths.sourceLocale).toBe(path.join(configProjectDir, 'locales', 'en.json'));
    expect(ctx.paths.localesDir).toBe(path.join(configProjectDir, 'locales'));
    expect(ctx.paths.srcRoot).toBe(path.join(configProjectDir, 'src'));
  });
});

describe('resolveContext CLI scan exclude flags', () => {
  let prevCwd: string;
  let dir: string;

  beforeEach(() => {
    prevCwd = process.cwd();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-excl-'));
    clearContextCache();
    resetConfigPathResolution();
    setConfigPath(undefined);
    resetCliGlobals();
  });

  afterEach(() => {
    process.chdir(prevCwd);
    fs.rmSync(dir, { recursive: true, force: true });
    clearContextCache();
    resetConfigPathResolution();
    setConfigPath(undefined);
    resetCliGlobals();
  });

  it('merges --exclude dir names after config exclude.dirs and honors default-skip override', async () => {
    const cfgPath = path.join(dir, 'i18nprune.config.ts');
    fs.writeFileSync(
      cfgPath,
      `export default {
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        exclude: { dirs: ['fixtures'], useDefaultSkip: true },
      }`,
      'utf8',
    );
    process.chdir(dir);
    setConfigPath(cfgPath);
    await ensureConfigPathResolved(dir);
    setCliGlobalOverrides({
      scanExcludeDirNames: ['bench', 'compiled'],
      noDefaultScanSkip: true,
    });
    const ctx = await resolveContext(dir);
    expect(ctx.config.exclude?.dirs).toEqual(['fixtures', 'bench', 'compiled']);
    expect(ctx.config.exclude?.useDefaultSkip).toBe(false);
  });

  it('deduplicates merged --exclude dir names while preserving order', async () => {
    const cfgPath = path.join(dir, 'i18nprune.config.ts');
    fs.writeFileSync(
      cfgPath,
      `export default {
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        exclude: { dirs: ['fixtures', 'bench'] },
      }`,
      'utf8',
    );
    process.chdir(dir);
    setConfigPath(cfgPath);
    await ensureConfigPathResolved(dir);
    setCliGlobalOverrides({
      scanExcludeDirNames: ['bench', 'compiled', 'bench'],
    });
    const ctx = await resolveContext(dir);
    expect(ctx.config.exclude?.dirs).toEqual(['fixtures', 'bench', 'compiled']);
  });

  it('resolves cache metadata by default with project id', async () => {
    const cfgPath = path.join(dir, 'i18nprune.config.ts');
    fs.writeFileSync(
      cfgPath,
      `export default {
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
      }`,
      'utf8',
    );
    process.chdir(dir);
    setConfigPath(cfgPath);
    await ensureConfigPathResolved(dir);
    const ctx = await resolveContext(dir);
    const expectedCache = resolveCliCacheState({ projectRoot: dir });
    expect(ctx.meta.cache.enabled).toBe(true);
    expect(ctx.meta.cache.reason).toBe('default');
    expect(ctx.meta.cache.projectId).toBe(expectedCache.projectId);
    expect(ctx.meta.cache.filesPath.endsWith(path.join('projects', expectedCache.projectId, 'files.json'))).toBe(true);
    expect(ctx.meta.cache.readOnly).toBe(false);
  });

  it('applies --cache-profile via cli globals', async () => {
    const cfgPath = path.join(dir, 'i18nprune.config.ts');
    fs.writeFileSync(
      cfgPath,
      `export default {
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        cache: { profile: 'balanced', rebuild: 'partial' },
      }`,
      'utf8',
    );
    process.chdir(dir);
    setConfigPath(cfgPath);
    await ensureConfigPathResolved(dir);
    setCliGlobalOverrides({ cacheProfile: 'safe' });
    const ctx = await resolveContext(dir);
    expect(ctx.config.cache?.profile).toBe('safe');
    expect(ctx.config.cache?.rebuild).toBe('partial');
  });

  it('honors --no-cache via cli globals', async () => {
    const cfgPath = path.join(dir, 'i18nprune.config.ts');
    fs.writeFileSync(
      cfgPath,
      `export default {
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
      }`,
      'utf8',
    );
    process.chdir(dir);
    setConfigPath(cfgPath);
    await ensureConfigPathResolved(dir);
    setCliGlobalOverrides({ noCache: true });
    const ctx = await resolveContext(dir);
    expect(ctx.meta.cache.enabled).toBe(false);
    expect(ctx.meta.cache.reason).toBe('cli_no_cache');
  });

  it('forces patching enabled when --patch is set in cli globals', async () => {
    const cfgPath = path.join(dir, 'i18nprune.config.ts');
    fs.writeFileSync(
      cfgPath,
      `export default {
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        patching: {
          enabled: false,
          configPath: 'i18n.config.ts',
          loaderPath: 'generated-loader.ts',
        },
      }`,
      'utf8',
    );
    process.chdir(dir);
    setConfigPath(cfgPath);
    await ensureConfigPathResolved(dir);
    setCliGlobalOverrides({ patch: true });
    const ctx = await resolveContext(dir);
    expect(ctx.config.patching?.enabled).toBe(true);
  });
});
