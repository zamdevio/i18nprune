import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { DEFAULT_MISSING_LEAF_PLACEHOLDER } from '../../shared/constants/missing.js';
import { emitMissingPlaceholderLeavesPreview, emitMissingTargetWriteIntro, runMissing } from '../run.js';
import type { RunEvent } from '../../types/shared/run/index.js';

describe('runMissing', () => {
  it('formats locale target intro with English name and relative path', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-missing-run-'));
    try {
      const localesDir = path.join(root, 'locales');
      const srcRoot = path.join(root, 'src');
      fs.mkdirSync(localesDir, { recursive: true });
      fs.mkdirSync(srcRoot, { recursive: true });
      const sourcePath = path.join(localesDir, 'en.json');
      fs.writeFileSync(sourcePath, JSON.stringify({}));
      fs.writeFileSync(path.join(localesDir, 'ja.json'), JSON.stringify({}));
      fs.writeFileSync(path.join(srcRoot, 'app.ts'), "t('app.brand');\n");

      const nodeAdapters = createNodeRuntimeAdapters();
      const adapters = {
        ...nodeAdapters,
        system: { ...nodeAdapters.system, cwd: () => root },
      };
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        source: 'locales/en.json',
        localesDir: 'locales',
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: { sourceLocale: sourcePath, localesDir, srcRoot },
      });
      const events: RunEvent[] = [];
      const out = runMissing(ctx, { target: 'ja', dryRun: true }, {
        emit: (event) => events.push(event),
        runId: 'test',
      });

      emitMissingTargetWriteIntro({ emit: (event) => events.push(event), runId: 'test' }, out.targets[0]!);

      expect(
        events.some(
          (event) =>
            event.type === 'run.message' &&
            event.message === 'target Japanese (ja) has 1 missing path(s); preparing locales/ja.json',
        ),
      ).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('lists source and selected target placeholder leaves with relative file lines', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-missing-run-'));
    try {
      const localesDir = path.join(root, 'locales');
      const srcRoot = path.join(root, 'src');
      fs.mkdirSync(localesDir, { recursive: true });
      fs.mkdirSync(srcRoot, { recursive: true });
      const sourcePath = path.join(localesDir, 'en.json');
      fs.writeFileSync(
        sourcePath,
        `${JSON.stringify({ app: { brand: DEFAULT_MISSING_LEAF_PLACEHOLDER } }, null, 2)}\n`,
      );
      fs.writeFileSync(
        path.join(localesDir, 'ja.json'),
        `${JSON.stringify({ app: { cta: DEFAULT_MISSING_LEAF_PLACEHOLDER } }, null, 2)}\n`,
      );

      const nodeAdapters = createNodeRuntimeAdapters();
      const adapters = {
        ...nodeAdapters,
        system: { ...nodeAdapters.system, cwd: () => root },
      };
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        source: 'locales/en.json',
        localesDir: 'locales',
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: { sourceLocale: sourcePath, localesDir, srcRoot },
      });
      const events: RunEvent[] = [];
      const out = runMissing(ctx, { target: 'ja', dryRun: true, full: true }, {
        emit: (event) => events.push(event),
        runId: 'test',
      });

      emitMissingPlaceholderLeavesPreview(
        { emit: (event) => events.push(event), runId: 'test' },
        { leaves: out.placeholderLeaves, fullList: true },
      );

      expect(out.payload.placeholderLeaves).toEqual({
        count: 2,
        shown: 2,
        top: null,
        full: true,
        leaves: [
          expect.objectContaining({
            localeRole: 'source',
            localeCode: 'en',
            file: 'locales/en.json',
            path: 'app.brand',
            line: 3,
            location: 'locales/en.json:3',
          }),
          expect.objectContaining({
            localeRole: 'locale',
            localeCode: 'ja',
            file: 'locales/ja.json',
            path: 'app.cta',
            line: 3,
            location: 'locales/ja.json:3',
          }),
        ],
      });
      expect(
        events.some(
          (event) =>
            event.type === 'run.message' &&
            event.level === 'detail' &&
            event.message === '    · locales/ja.json:3 app.cta',
        ),
      ).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
