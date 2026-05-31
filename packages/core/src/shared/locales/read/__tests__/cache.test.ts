import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../../../config/index.js';
import { createCoreContext } from '../../../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../../../runtime/exports/node.js';
import {
  invalidateLocaleReadCacheForAbsolutePath,
  readLocaleCodeSurfaceFromContext,
  readLocaleSegmentFromContext,
} from '../index.js';

describe('locale read cache', () => {
  it('reuses segment reads within one CoreContext', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-locale-read-cache-'));
    try {
      const localesDir = path.join(root, 'locales');
      fs.mkdirSync(localesDir, { recursive: true });
      const enPath = path.join(localesDir, 'en.json');
      fs.writeFileSync(enPath, JSON.stringify({ hello: 'Hello' }));

      const rt = createNodeRuntimeAdapters();
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: { source: 'en', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
      const readSpy = vi.spyOn(rt.fs, 'readText');
      const ctx = createCoreContext({
        config,
        adapters: rt,
        env: {},
        paths: { sourceLocale: enPath, localesDir, srcRoot: path.join(root, 'src') },
      });

      const first = readLocaleSegmentFromContext(ctx, enPath);
      const second = readLocaleSegmentFromContext(ctx, enPath);
      expect(first.ok && second.ok).toBe(true);
      if (first.ok && second.ok) {
        expect(first.leaves[0]?.path).toBe('hello');
        expect(second.leaves).toBe(first.leaves);
      }
      expect(readSpy).toHaveBeenCalledTimes(1);

      readLocaleCodeSurfaceFromContext(ctx, 'en');
      expect(readSpy).toHaveBeenCalledTimes(1);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('invalidates segment and locale-code entries after a write path bust', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-locale-read-cache-'));
    try {
      const localesDir = path.join(root, 'locales');
      fs.mkdirSync(localesDir, { recursive: true });
      const enPath = path.join(localesDir, 'en.json');
      fs.writeFileSync(enPath, JSON.stringify({ a: '1' }));

      const rt = createNodeRuntimeAdapters();
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: { source: 'en', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: rt,
        env: {},
        paths: { sourceLocale: enPath, localesDir, srcRoot: path.join(root, 'src') },
      });

      readLocaleCodeSurfaceFromContext(ctx, 'en');
      expect(ctx.localeRead.segments.has(enPath)).toBe(true);
      expect(ctx.localeRead.localeCodes.has('en')).toBe(true);

      invalidateLocaleReadCacheForAbsolutePath(ctx, enPath);
      expect(ctx.localeRead.segments.has(enPath)).toBe(false);
      expect(ctx.localeRead.localeCodes.has('en')).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
