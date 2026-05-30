import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { readCleanupSourceLeaves, listCleanupSourceSegmentPaths } from '../sourceSurface.js';

describe('cleanup sourceSurface', () => {
  it('merges leaves across feature_bundle source segments', async () => {
    const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../../../..');
    const nextjsRoot = path.join(repoRoot, 'tests/fixtures/stacks/nextjs');
    const configMjs = path.join(nextjsRoot, 'i18nprune.config.mjs');
    const config = parseI18nPruneConfig((await import(configMjs)).default);
    const adapters = createNodeRuntimeAdapters();
    const ctx = createCoreContext({
      config,
      adapters,
      env: {},
      paths: {
        sourceLocale: path.join(nextjsRoot, 'messages/app/en.json'),
        localesDir: path.join(nextjsRoot, 'messages'),
        srcRoot: path.join(nextjsRoot, 'app'),
      },
    });
    const leaves = readCleanupSourceLeaves(ctx);
    const paths = new Set(leaves.map((l) => l.path));
    expect(paths.has('app.title')).toBe(true);
    expect(paths.has('page.cta')).toBe(true);
    const segments = listCleanupSourceSegmentPaths(ctx);
    expect(segments.length).toBeGreaterThan(1);
    expect(segments.some((s) => s.relativePath === 'common/en.json')).toBe(true);
  });

  it('reads flat_file source as one segment', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cleanup-flat-'));
    try {
      const localesDir = path.join(root, 'locales');
      fs.mkdirSync(localesDir, { recursive: true });
      const sourcePath = path.join(localesDir, 'en.json');
      fs.writeFileSync(sourcePath, JSON.stringify({ hello: 'Hello' }));
      const config = parseI18nPruneConfig({
        locales: { source: 'en', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: createNodeRuntimeAdapters(),
        env: {},
        paths: { sourceLocale: sourcePath, localesDir, srcRoot: path.join(root, 'src') },
      });
      expect(readCleanupSourceLeaves(ctx).map((l) => l.path)).toEqual(['hello']);
      expect(listCleanupSourceSegmentPaths(ctx)).toHaveLength(1);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
