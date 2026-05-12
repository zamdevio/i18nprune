import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { resetCliGlobals, setCliGlobalOverrides } from '@/shared/context/index.js';
import type { Context } from '@/types/core/context/index.js';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cli-patching-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  resetCliGlobals();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function makeContext(config: Context['config']): Context {
  return {
    config,
    paths: {
      sourceLocale: '/tmp/en.json',
      localesDir: '/tmp/locales',
      srcRoot: '/tmp/src',
    },
    run: { json: false, jsonPretty: false, quiet: false, silent: false, debugScan: false, debugCache: false },
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

describe('applyCommandPatching', () => {
  it('returns undefined for empty locale list', async () => {
    const ctx = makeContext({
      source: './locales/en.json',
      localesDir: './locales',
      src: './src',
      functions: ['t'],
    });
    const out = await applyCommandPatching({
      ctx,
      command: 'generate',
      action: 'upsert_locales',
      localeCodes: [],
    });
    expect(out).toBeUndefined();
  });

  it('pushes warnings when patching is enabled but config paths are invalid', async () => {
    setCliGlobalOverrides({ patch: true });
    const root = makeTempDir();
    const ctx = makeContext({
      source: './locales/en.json',
      localesDir: './locales',
      src: './src',
      functions: ['t'],
      patching: {
        enabled: true,
        recipe: 'loader_generated',
        loaderPath: path.join(root, 'missing-loaders.generated.ts'),
        configPath: path.join(root, 'missing-config.json'),
      },
    });
    const out = await applyCommandPatching({
      ctx,
      command: 'generate',
      action: 'upsert_locales',
      localeCodes: ['fr'],
    });
    expect(out).toBeDefined();
    expect(out?.applied).toBe(false);
    expect(ctx.meta.warnings.some((w) => w.includes('patching: file not found'))).toBe(true);
  });

  it('skips runPatching when --patch is set but patching paths are empty (incomplete section)', async () => {
    setCliGlobalOverrides({ patch: true });
    const ctx = makeContext({
      source: './locales/en.json',
      localesDir: './locales',
      src: './src',
      functions: ['t'],
      patching: {
        enabled: false,
        recipe: 'loader_generated',
        mode: 'warn_skip',
      },
    });
    const out = await applyCommandPatching({
      ctx,
      command: 'generate',
      action: 'upsert_locales',
      localeCodes: ['fr'],
    });
    expect(out).toBeUndefined();
    expect(ctx.meta.warnings.some((w) => w.includes('required field(s) are empty'))).toBe(true);
  });

  it('skips patch integration unless --patch flag is enabled', async () => {
    const root = makeTempDir();
    const ctx = makeContext({
      source: './locales/en.json',
      localesDir: './locales',
      src: './src',
      functions: ['t'],
      patching: {
        enabled: true,
        recipe: 'loader_generated',
        loaderPath: path.join(root, 'missing-loaders.generated.ts'),
        configPath: path.join(root, 'missing-config.json'),
      },
    });
    const out = await applyCommandPatching({
      ctx,
      command: 'generate',
      action: 'upsert_locales',
      localeCodes: ['fr'],
    });
    expect(out).toBeUndefined();
  });
});
