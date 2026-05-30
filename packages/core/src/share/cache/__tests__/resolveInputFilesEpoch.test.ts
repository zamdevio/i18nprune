import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../../config/index.js';
import { initializeCacheState } from '../../../cache/setup/index.js';
import { EMPTY_INPUT_FILES_EPOCH } from '../../../cache/emptyEpoch.js';
import { createCoreContext } from '../../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import type { CacheRuntime } from '../../../types/cache/index.js';
import { resolveShareInputFilesEpoch } from '../resolveInputFilesEpoch.js';

function nodeCacheRuntime(adapters: ReturnType<typeof createNodeRuntimeAdapters>): CacheRuntime {
  return {
    fs: adapters.fs,
    path: adapters.path,
    system: adapters.system,
    hashText: (text) => crypto.createHash('sha256').update(text).digest('hex'),
    byteLength: (text) => Buffer.byteLength(text, 'utf8'),
  };
}

describe('resolveShareInputFilesEpoch', () => {
  it('returns undefined when files.json is missing (not empty-hash sentinel)', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-epoch-'));
    try {
      const localesDir = path.join(root, 'locales');
      const srcRoot = path.join(root, 'src');
      fs.mkdirSync(localesDir, { recursive: true });
      fs.mkdirSync(srcRoot, { recursive: true });
      fs.writeFileSync(path.join(root, 'i18nprune.config.json'), '{}');
      fs.writeFileSync(path.join(srcRoot, 'app.ts'), 'export const x = () => t("a");');
      const sourcePath = path.join(localesDir, 'en.json');
      fs.writeFileSync(sourcePath, JSON.stringify({ a: 'A' }));

      const cacheRoot = path.join(root, '.cache');
      fs.mkdirSync(cacheRoot, { recursive: true });
      const adapters = createNodeRuntimeAdapters();
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: { source: 'en', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
      const cacheRuntime = nodeCacheRuntime(adapters);
      const { state } = initializeCacheState({
        projectRoot: root,
        cacheRootDir: cacheRoot,
        runtime: cacheRuntime,
      });
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: { sourceLocale: sourcePath, localesDir, srcRoot },
        cache: { state, runtime: cacheRuntime },
      });

      expect(resolveShareInputFilesEpoch(ctx)).toBeUndefined();
      expect(EMPTY_INPUT_FILES_EPOCH).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
