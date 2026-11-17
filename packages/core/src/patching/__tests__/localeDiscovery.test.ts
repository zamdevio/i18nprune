import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { composeLoadersGeneratedFile, renderGeneratedInnerBlock } from '../generatedModule.js';
import { buildPatchPlan } from '../plan.js';
import { runPatching } from '../run.js';
import {
  listPatchingLocaleCodesOnDisk,
  resolvePatchingLocaleImportSpec,
} from '../localeDiscovery.js';
import { resolveLocalesLayout } from '../../shared/locales/layout/resolveLayout.js';
import type { ResolvedLocalesLayout } from '../../types/locales/layout.js';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-patching-layout-'));
  tempDirs.push(dir);
  return dir;
}

function writeLocalePerDirFixture(root: string): {
  layout: ResolvedLocalesLayout;
  configPath: string;
  loaderPath: string;
} {
  const messages = path.join(root, 'messages');
  const i18nDir = path.join(root, 'src', 'i18n');
  fs.mkdirSync(i18nDir, { recursive: true });
  for (const locale of ['en', 'fr']) {
    const dir = path.join(messages, locale);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'app.json'), '{"title":"x"}', 'utf8');
    fs.writeFileSync(path.join(dir, 'nav.json'), '{"home":"x"}', 'utf8');
  }
  const layout = resolveLocalesLayout(
    {
      source: 'en',
      directory: 'messages',
      mode: 'locale_directory',
      structure: 'locale_per_dir',
    },
    messages,
  );
  const configPath = path.join(i18nDir, 'config.json');
  const loaderPath = path.join(i18nDir, 'loaders.generated.ts');
  const records = [
    { code: 'app', englishName: 'app', nativeName: 'app', direction: 'ltr' as const },
    { code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' as const },
    { code: 'fr', englishName: 'French', nativeName: 'français', direction: 'ltr' as const },
  ];
  fs.writeFileSync(configPath, `${JSON.stringify({ locales: records }, null, 2)}\n`, 'utf8');
  const spec = resolvePatchingLocaleImportSpec({
    layout,
    runtime: createNodeRuntimeAdapters(),
    localesDir: messages,
    sourceLocaleCode: 'en',
  });
  const inner = renderGeneratedInnerBlock({
    records,
    importBase: '../../messages',
    defaultLocaleCode: 'en',
    localeImportSpec: spec,
  });
  fs.writeFileSync(loaderPath, composeLoadersGeneratedFile(inner, '// user\n'), 'utf8');
  return { layout, configPath, loaderPath };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('patching locale layout discovery', () => {
  it('lists locale codes for locale_per_dir (not segment basenames)', () => {
    const root = makeTempDir();
    const messages = path.join(root, 'messages');
    for (const locale of ['en', 'fr']) {
      const dir = path.join(messages, locale);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'app.json'), '{}', 'utf8');
      fs.writeFileSync(path.join(dir, 'nav.json'), '{}', 'utf8');
    }
    const rt = createNodeRuntimeAdapters();
    const layout: ResolvedLocalesLayout = {
      mode: 'locale_directory',
      structure: 'locale_per_dir',
      directoryAbsolute: messages,
      config: { source: 'en', directory: 'messages', mode: 'locale_directory', structure: 'locale_per_dir' },
    };
    const codes = listPatchingLocaleCodesOnDisk({ runtime: rt, localesDir: messages, layout });
    expect(codes).toEqual(['en', 'fr']);
  });

  it('builds multi-segment loader imports for locale_per_dir', () => {
    const root = makeTempDir();
    const messages = path.join(root, 'messages');
    const enDir = path.join(messages, 'en');
    fs.mkdirSync(enDir, { recursive: true });
    fs.writeFileSync(path.join(enDir, 'app.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(enDir, 'nav.json'), '{}', 'utf8');
    const rt = createNodeRuntimeAdapters();
    const layout: ResolvedLocalesLayout = {
      mode: 'locale_directory',
      structure: 'locale_per_dir',
      directoryAbsolute: messages,
      config: { source: 'en', directory: 'messages', mode: 'locale_directory', structure: 'locale_per_dir' },
    };
    const spec = resolvePatchingLocaleImportSpec({
      layout,
      runtime: rt,
      localesDir: messages,
      sourceLocaleCode: 'en',
    });
    expect(spec).toEqual({ kind: 'locale_per_dir', segmentBasenames: ['app', 'nav'] });
    const inner = renderGeneratedInnerBlock({
      records: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
      importBase: '../../messages',
      localeImportSpec: spec,
    });
    expect(inner).toContain('../../messages/en/app.json');
    expect(inner).toContain('../../messages/en/nav.json');
    expect(inner).toContain('Promise.all');
  });

  it('BUG-004: multi-segment loader deep-merges instead of Object.assign', () => {
    const inner = renderGeneratedInnerBlock({
      records: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
      importBase: '../../messages',
      localeImportSpec: { kind: 'locale_per_dir', segmentBasenames: ['a', 'b'] },
    });
    expect(inner).toContain('function deepMergeLocaleMessages');
    expect(inner).toContain('deepMergeLocaleMessages(');
    expect(inner).not.toMatch(/Object\.assign\(\s*\{\}\s*,\s*\.\.\.mods/);
  });

  it('BUG-005: nested feature_bundle paths keep full feature basenames in loader imports', () => {
    const root = makeTempDir();
    const messages = path.join(root, 'messages');
    for (const feature of ['dashboard', 'login', 'maintenance/details', 'maintenance/list']) {
      const dir = path.join(messages, ...feature.split('/'));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'en.json'), '{}', 'utf8');
      fs.writeFileSync(path.join(dir, 'so.json'), '{}', 'utf8');
    }
    const rt = createNodeRuntimeAdapters();
    const layout: ResolvedLocalesLayout = {
      mode: 'locale_directory',
      structure: 'feature_bundle',
      directoryAbsolute: messages,
      config: {
        source: 'en',
        directory: 'messages',
        mode: 'locale_directory',
        structure: 'feature_bundle',
      },
    };
    const spec = resolvePatchingLocaleImportSpec({
      layout,
      runtime: rt,
      localesDir: messages,
      sourceLocaleCode: 'en',
    });
    expect(spec).toEqual({
      kind: 'feature_bundle',
      featureBasenames: ['dashboard', 'login', 'maintenance/details', 'maintenance/list'],
    });
    const inner = renderGeneratedInnerBlock({
      records: [
        { code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' },
        { code: 'so', englishName: 'Somali', nativeName: 'Soomaali', direction: 'ltr' },
      ],
      importBase: '../../messages',
      localeImportSpec: spec,
    });
    expect(inner).toContain('../../messages/dashboard/en.json');
    expect(inner).toContain('../../messages/maintenance/details/en.json');
    expect(inner).toContain('../../messages/maintenance/list/en.json');
    expect(inner).not.toContain('../../messages/maintenance/en.json');
    expect(inner).toContain('deepMergeLocaleMessages');
  });

  it('removes bogus segment-as-locale drift via delete_locales plan', async () => {
    const root = makeTempDir();
    const { layout, configPath, loaderPath } = writeLocalePerDirFixture(root);
    const rt = createNodeRuntimeAdapters();
    const planned = await buildPatchPlan({
      command: 'sync',
      action: 'delete_locales',
      changedLocaleCodes: ['app'],
      sourceLocaleCode: 'en',
      config: {
        enabled: true,
        recipe: 'loader_generated',
        configPath,
        loaderPath,
        localeJsonImportBase: 'messages',
      },
      runtime: rt,
      projectRoot: root,
      localesLayout: layout,
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.plan.edits.length).toBeGreaterThan(0);
    const configEdit = planned.plan.edits.find((e) => e.kind === 'config');
    expect(configEdit?.after).not.toContain('"code": "app"');
    const genEdit = planned.plan.edits.find((e) => e.kind === 'generated');
    expect(genEdit?.after).toContain('../../messages/en/app.json');
  });

  it('runPatching delete_locales removes phantom locale codes', async () => {
    const root = makeTempDir();
    const { layout, configPath, loaderPath } = writeLocalePerDirFixture(root);
    const rt = createNodeRuntimeAdapters();
    const result = await runPatching({
      command: 'sync',
      action: 'delete_locales',
      changedLocaleCodes: ['app'],
      sourceLocaleCode: 'en',
      config: {
        enabled: true,
        recipe: 'loader_generated',
        configPath,
        loaderPath,
        localeJsonImportBase: 'messages',
      },
      runtime: rt,
      projectRoot: root,
      localesLayout: layout,
    });
    expect(result.applied).toBe(true);
    const nextConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { locales: Array<{ code: string }> };
    expect(nextConfig.locales.map((r) => r.code)).not.toContain('app');
  });
});
