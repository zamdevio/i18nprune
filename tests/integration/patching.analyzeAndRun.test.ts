import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzePatchingState, runPatching } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

/**
 * Chains **analyze → runPatching** the way `patch --fix` does for file-only drift (no CLI spawn).
 */
describe('patching integration (core chain)', () => {
  it('reconciles locale JSON on disk missing from config, then registry matches config', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-patch-int-'));
    try {
      const i18nDir = path.join(root, 'src', 'i18n');
      const localesDir = path.join(root, 'locales');
      fs.mkdirSync(localesDir, { recursive: true });
      fs.mkdirSync(i18nDir, { recursive: true });
      fs.writeFileSync(path.join(localesDir, 'en.json'), '{}', 'utf8');
      fs.writeFileSync(path.join(localesDir, 'fr.json'), '{}', 'utf8');

      const configPath = path.join(i18nDir, 'config.json');
      const loaderPath = path.join(i18nDir, 'loaders.generated.ts');
      fs.writeFileSync(
        configPath,
        `${JSON.stringify(
          {
            locales: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
      fs.writeFileSync(loaderPath, '', 'utf8');

      const rt = createNodeRuntimeAdapters();
      const analyzed = await analyzePatchingState({
        command: 'generate',
        action: 'upsert_locales',
        changedLocaleCodes: [],
        config: {
          enabled: true,
          recipe: 'loader_generated',
          configPath,
          loaderPath,
          localeJsonImportBase: 'locales',
        },
        projectRoot: root,
        runtime: { fs: rt.fs, path: rt.path },
      });
      expect(analyzed.fileOnlyCodes).toContain('fr');

      const out = await runPatching({
        command: 'sync',
        action: 'upsert_locales',
        changedLocaleCodes: analyzed.fileOnlyCodes,
        sourceLocaleCode: 'en',
        config: {
          enabled: true,
          recipe: 'loader_generated',
          configPath,
          loaderPath,
          localeJsonImportBase: 'locales',
        },
        projectRoot: root,
        runtime: { fs: rt.fs, path: rt.path },
      });
      expect(out.applied).toBe(true);

      const nextConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { locales: Array<{ code: string }> };
      const gen = fs.readFileSync(loaderPath, 'utf8');
      const m = gen.match(/const LOCALE_REGISTRY = (\[[\s\S]*?\])\s+as const;/);
      expect(m).toBeTruthy();
      const registry = JSON.parse(m![1]!) as Array<{ code: string }>;
      expect(registry.map((r) => r.code)).toEqual(nextConfig.locales.map((r) => r.code));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
