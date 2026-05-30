import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TranslationSurfaceLeaf } from '../../../../types/locales/leaves/translationSurface.js';
import { parseI18nPruneConfig } from '../../../../config/index.js';
import { createCoreContext } from '../../../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../../../runtime/exports/node.js';
import { readLocalePerDirLocaleSurface } from '../../read/bundle.js';
import { resolveLocalesLayoutFromContext } from '../../layout/resolveLayout.js';
import { materializeGenerateWorkingBySegment } from '../segmentMaterialize.js';
import { resolveTargetLocaleWritePlan } from '../segmentWritePlan.js';
import { sourceLocaleCodeFromContext } from '../context.js';
import { setAtPath } from '../../../json/path.js';

describe('materialize fileOrigin vs segment paths', () => {
  it('matches when localesDir is absolute (CLI-resolved)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-mat-abs-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'common'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'app', 'en.json'), '{"app.title":"A"}', 'utf8');
      fs.writeFileSync(path.join(messages, 'common', 'en.json'), '{"page.cta":"Go"}', 'utf8');
      const config = parseI18nPruneConfig({
        locales: {
          source: 'en',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'feature_bundle',
        },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: createNodeRuntimeAdapters(),
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(dir, 'src'),
        },
      });
      const layout = resolveLocalesLayoutFromContext(ctx);
      const read = readLocalePerDirLocaleSurface({
        layout,
        fs: ctx.adapters.fs,
        path: ctx.adapters.path,
        localeCode: 'en',
      });
      const appOrigin = read.leaves.find((l) => l.path === 'app.title')?.fileOrigin?.relativePath;
      expect(appOrigin).toBe('app/en.json');

      const plan = resolveTargetLocaleWritePlan(ctx, 'ar');
      let working: unknown = {};
      for (const leaf of read.leaves) {
        working = setAtPath(working, leaf.path, 'X');
      }
      const parts = materializeGenerateWorkingBySegment({
        working,
        sourceLeaves: read.leaves,
        segments: plan.segments,
        structure: layout.structure,
        sourceLocaleCode: sourceLocaleCodeFromContext(ctx),
        layout,
        fs: ctx.adapters.fs,
        path: ctx.adapters.path,
      });
      expect(collectLeaves(parts[0]?.document)).toBeGreaterThan(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('falls back to source segment read when fileOrigin does not match bundle path', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-mat-rel-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'app', 'en.json'), '{"app.title":"A"}', 'utf8');
      const config = parseI18nPruneConfig({
        locales: {
          source: 'en',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'feature_bundle',
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
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(dir, 'src'),
        },
      });
      const layout = resolveLocalesLayoutFromContext(ctx);
      const read = readLocalePerDirLocaleSurface({
        layout,
        fs: ctx.adapters.fs,
        path: ctx.adapters.path,
        localeCode: 'en',
      });
      const appLeaf = read.leaves.find((l) => l.path === 'app.title');
      expect(appLeaf?.fileOrigin?.relativePath).toBe('app/en.json');

      const plan = resolveTargetLocaleWritePlan(ctx, 'ar');
      const mismatchedOrigin: TranslationSurfaceLeaf[] = [
        {
          ...appLeaf!,
          fileOrigin: { file: appLeaf!.fileOrigin!.file, locale: 'en', relativePath: 'en.json' },
        },
      ];
      const working: unknown = setAtPath({}, 'app.title', 'TRANSLATED');
      const parts = materializeGenerateWorkingBySegment({
        working,
        sourceLeaves: mismatchedOrigin,
        segments: plan.segments.filter((s) => s.relativePath === 'app/ar.json'),
        structure: layout.structure,
        sourceLocaleCode: 'en',
        layout,
        fs: adapters.fs,
        path: adapters.path,
      });
      expect(parts[0]?.document).not.toEqual({});
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

function collectLeaves(doc: unknown): number {
  if (!doc || typeof doc !== 'object') return 0;
  return Object.keys(doc as object).length;
}
