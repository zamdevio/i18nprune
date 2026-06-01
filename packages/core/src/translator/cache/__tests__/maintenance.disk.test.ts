import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeCacheState, prepareCacheForRun } from '../../../cache/setup/index.js';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import type { CacheRuntime } from '../../../types/cache/index.js';
import { resolveLocaleTranslationCachePath } from '../paths.js';

function nodeCacheRuntime(adapters: ReturnType<typeof createNodeRuntimeAdapters>): CacheRuntime {
  return {
    fs: adapters.fs,
    path: adapters.path,
    system: adapters.system,
    hashText: (text) => crypto.createHash('sha256').update(text).digest('hex'),
    byteLength: (text) => Buffer.byteLength(text, 'utf8'),
  };
}

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('prepareTranslationCacheLayout (disk)', () => {
  it('heals malformed translations/*.json via host path.join', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-translate-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const adapters = createNodeRuntimeAdapters();
    const runtime = nodeCacheRuntime(adapters);
    const { state } = initializeCacheState({
      projectRoot: root,
      cacheRootDir,
      runtime,
    });
    fs.mkdirSync(state.projectDir, { recursive: true });
    const localePath = resolveLocaleTranslationCachePath(state, runtime, 'fr');
    fs.mkdirSync(path.dirname(localePath), { recursive: true });
    fs.writeFileSync(localePath, '{not json', 'utf8');

    const out = prepareCacheForRun(state, runtime);

    expect(
      out.warnings.some((w) => w.code === 'cache_malformed' && path.normalize(w.path ?? '') === path.normalize(localePath)),
    ).toBe(true);
    expect(fs.existsSync(localePath)).toBe(false);
  });
});
