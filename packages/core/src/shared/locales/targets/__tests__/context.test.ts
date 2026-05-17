import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../../../config/index.js';
import { createCoreContext } from '../../../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../../../runtime/exports/node.js';
import {
  listLocaleSegmentTargets,
  primarySegmentForLocale,
  resolveLocaleSegmentTargets,
  sourceLocaleCodeFromContext,
} from '../context.js';

describe('locale targets from context', () => {
  it('lists per-dir segments and resolves sync targets by locale code', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-targets-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'en'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'fr'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'en', 'a.json'), '{"x":"A"}', 'utf8');
      fs.writeFileSync(path.join(messages, 'fr', 'a.json'), '{"x":"B"}', 'utf8');
      const config = parseI18nPruneConfig({
        locales: {
          source: 'messages/en/a.json',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'locale_per_dir',
        },
        src: 'src',
        functions: ['t'],
      });
      const adapters = createNodeRuntimeAdapters();
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: {
          sourceLocale: path.join(dir, 'messages/en/a.json'),
          localesDir: path.join(dir, 'messages'),
          srcRoot: path.join(dir, 'src'),
        },
      });
      expect(sourceLocaleCodeFromContext(ctx)).toBe('en');
      const segments = listLocaleSegmentTargets(ctx);
      expect(segments.map((s) => s.relativePath).sort()).toEqual(['en/a.json', 'fr/a.json']);
      const { segments: targets, missingLocaleCodes } = resolveLocaleSegmentTargets(ctx, {
        selection: { mode: 'codes', codes: ['fr'] },
      });
      expect(missingLocaleCodes).toEqual([]);
      expect(targets.map((t) => t.relativePath)).toEqual(['fr/a.json']);
      expect(primarySegmentForLocale(ctx, 'fr')?.absolutePath).toBe(path.join(messages, 'fr', 'a.json'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
