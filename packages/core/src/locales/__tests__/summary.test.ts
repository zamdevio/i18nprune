import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { buildLocaleListRows } from '../summary.js';

describe('buildLocaleListRows', () => {
  it('builds rows with leaf counts and source-identical counts', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-locale-summary-'));
    try {
      const localesDir = path.join(root, 'locales');
      fs.mkdirSync(localesDir, { recursive: true });
      const sourcePath = path.join(localesDir, 'en.json');
      fs.writeFileSync(sourcePath, JSON.stringify({ a: { b: 'x' } }));
      fs.writeFileSync(path.join(localesDir, 'fr.json'), JSON.stringify({ a: { b: 'x' } }));
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: { source: 'locales/en.json', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: createNodeRuntimeAdapters(),
        env: {},
        paths: { sourceLocale: sourcePath, localesDir, srcRoot: path.join(root, 'src') },
      });
      const rows = buildLocaleListRows(ctx, ['fr', 'en']);
      expect(rows.map((r) => r.code).sort()).toEqual(['en', 'fr']);
      const fr = rows.find((r) => r.code === 'fr');
      expect(fr?.englishIdenticalLeafCount).toBe(1);
      const en = rows.find((r) => r.code === 'en');
      expect(en?.isSourceLocale).toBe(true);
      expect(en?.englishIdenticalLeafCount).toBe(null);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
