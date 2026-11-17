import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { resolveProjectAnalysis } from '../project.js';
import { patchProjectAnalysisFromSourceLocaleDelta } from '../rebuild.js';

describe('finite-keys Track A (locale-assisted candidates)', () => {
  it('attaches locale_inferred candidates under staticPrefix without changing provenKeys', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-finite-keys-'));
    try {
      const srcRoot = path.join(root, 'src');
      const localesDir = path.join(root, 'locales');
      fs.mkdirSync(srcRoot, { recursive: true });
      fs.mkdirSync(localesDir, { recursive: true });
      fs.writeFileSync(
        path.join(srcRoot, 'nav.ts'),
        'export const label = (id: string) => t(`app.nav.${id}`);\nexport const static = () => t("app.title");\n',
      );
      const sourcePath = path.join(localesDir, 'en.json');
      fs.writeFileSync(
        sourcePath,
        JSON.stringify({
          app: {
            title: 'Title',
            nav: { about: 'About', home: 'Home' },
          },
        }),
      );

      const adapters = createNodeRuntimeAdapters();
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: { source: 'en', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: { sourceLocale: sourcePath, localesDir, srcRoot },
      });

      const analysis = resolveProjectAnalysis(ctx);
      expect([...analysis.usage.resolvedKeys].sort()).toEqual(['app.title']);

      const site = analysis.dynamicSites.find(
        (s) => s.kind === 'template_interpolation' && s.staticPrefix === 'app.nav',
      );
      expect(site).toBeDefined();
      expect(site?.candidateKeys?.map((c) => c.key)).toEqual(['app.nav.about', 'app.nav.home']);
      expect(site?.candidateKeys?.every((c) => c.confidence === 'locale_inferred')).toBe(true);
      expect(site?.candidateKeysTruncated).toBeUndefined();
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('refreshes candidates on source-locale patch without rescanning proven keys', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-finite-keys-locale-'));
    try {
      const srcRoot = path.join(root, 'src');
      const localesDir = path.join(root, 'locales');
      fs.mkdirSync(srcRoot, { recursive: true });
      fs.mkdirSync(localesDir, { recursive: true });
      fs.writeFileSync(path.join(srcRoot, 'nav.ts'), 'export const label = (id: string) => t(`app.nav.${id}`);\n');
      const sourcePath = path.join(localesDir, 'en.json');
      fs.writeFileSync(sourcePath, JSON.stringify({ app: { nav: { home: 'Home' } } }));

      const adapters = createNodeRuntimeAdapters();
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: { source: 'en', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: { sourceLocale: sourcePath, localesDir, srcRoot },
      });

      const before = resolveProjectAnalysis(ctx);
      expect(before.dynamicSites[0]?.candidateKeys?.map((c) => c.key)).toEqual(['app.nav.home']);

      fs.writeFileSync(
        sourcePath,
        JSON.stringify({ app: { nav: { about: 'About', home: 'Home' } } }),
      );
      const patched = patchProjectAnalysisFromSourceLocaleDelta(ctx, before);
      const fullAfter = resolveProjectAnalysis(ctx);

      expect(patched.keyObservations).toBe(before.keyObservations);
      expect(patched.dynamicSites[0]?.candidateKeys?.map((c) => c.key)).toEqual([
        'app.nav.about',
        'app.nav.home',
      ]);
      expect(patched.dynamicSites).toEqual(fullAfter.dynamicSites);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
