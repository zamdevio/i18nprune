import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { resolveTargetLocaleWritePlan } from '../../shared/locales/targets/segmentWritePlan.js';
import { assessGenerateTargetPreflight } from '../assessTargetPreflight.js';

describe('assessGenerateTargetPreflight', () => {
  it('returns proceed when target is complete but has placeholder sentinel leaks', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-preflight-leak-'));
    try {
      const targetPath = path.join(dir, 'ar.json');
      fs.writeFileSync(path.join(dir, 'en.json'), JSON.stringify({ meta: 'x', title: 'done' }), 'utf8');
      fs.writeFileSync(
        targetPath,
        JSON.stringify({
          meta: '__I18NPRUNE_0__ · __I18NPRUNE_1__',
          title: 'done',
        }),
        'utf8',
      );
      const config = parseI18nPruneConfig({
        locales: { source: 'en', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: createNodeRuntimeAdapters(),
        env: {},
        paths: {
          sourceLocale: path.join(dir, 'en.json'),
          localesDir: dir,
          srcRoot: path.join(dir, 'src'),
        },
      });
      const writePlan = resolveTargetLocaleWritePlan(ctx, 'ar');
      const existingRaw = JSON.parse(fs.readFileSync(targetPath, 'utf8')) as object;
      const out = assessGenerateTargetPreflight({
        sourceLeaves: [{ path: 'meta' }, { path: 'title' }],
        writePlan,
        existingRaw,
        fs: ctx.adapters.fs,
        localeCode: 'ar',
      });
      expect(out.status).toBe('proceed');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detects partial when segment files or keys are missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-preflight-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'common'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'app', 'en.json'), '{"app.title":"A"}', 'utf8');
      fs.writeFileSync(path.join(messages, 'common', 'en.json'), '{"layout.skip":"Skip"}', 'utf8');
      fs.writeFileSync(path.join(messages, 'app', 'ar.json'), '{"app":{"title":"x"}}', 'utf8');
      const config = parseI18nPruneConfig({
        locales: {
          source: 'en',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'feature_bundle',
        },
        src: 'app',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: createNodeRuntimeAdapters(),
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(dir, 'app'),
        },
      });
      const writePlan = resolveTargetLocaleWritePlan(ctx, 'ar');
      const partial = assessGenerateTargetPreflight({
        sourceLeaves: [{ path: 'app.title' }, { path: 'layout.skip' }],
        writePlan,
        existingRaw: { app: { title: 'x' } },
        fs: ctx.adapters.fs,
      });
      expect(partial.status).toBe('partial');
      expect(partial.missingSegmentPaths.some((p) => p.includes('common'))).toBe(true);
      expect(partial.missingKeyPaths).toContain('layout.skip');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
