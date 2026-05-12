import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { ISSUE_PATCHING_CONFIG_SECTION_INCOMPLETE } from '../../shared/constants/issueCodes.js';
import {
  analyzePatchingState,
  applyPatchPlanAtomic,
  buildPatchPlan,
  composeLoadersGeneratedFile,
  renderGeneratedInnerBlock,
  resolvePatchingConfigLocales,
  runPatching,
} from '../index.js';
import type { PatchingPlan, PatchingRuntimePorts } from '../../types/patching/index.js';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-patching-'));
  tempDirs.push(dir);
  return dir;
}

function writeFixtureFiles(root: string): { configPath: string; generatedPath: string } {
  const generatedPath = path.join(root, 'loaders.generated.ts');
  const configPath = path.join(root, 'i18n.config.json');
  fs.writeFileSync(
    configPath,
    `${JSON.stringify(
      {
        locales: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
        extra: { untouched: true },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  const inner = renderGeneratedInnerBlock({
    records: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
    importBase: './locales',
    defaultLocaleCode: 'en',
  });
  fs.writeFileSync(generatedPath, composeLoadersGeneratedFile(inner, '// user\n'), 'utf8');
  return { configPath, generatedPath };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('patching engine', () => {
  it('skips when disabled', async () => {
    const rt = createNodeRuntimeAdapters();
    const out = await runPatching({
      command: 'generate',
      action: 'upsert_locales',
      changedLocaleCodes: ['fr'],
      config: { enabled: false },
      runtime: { fs: rt.fs, path: rt.path },
    });
    expect(out.applied).toBe(false);
    expect(out.skipped).toBe(true);
    expect(out.skipReason).toBe('disabled');
  });

  it('builds and applies plan for loader_generated', async () => {
    const root = makeTempDir();
    const { generatedPath, configPath } = writeFixtureFiles(root);
    const rt = createNodeRuntimeAdapters();
    const planned = await buildPatchPlan({
      command: 'generate',
      action: 'upsert_locales',
      changedLocaleCodes: ['fr'],
      config: {
        enabled: true,
        recipe: 'loader_generated',
        configPath,
        loaderPath: generatedPath,
        localeJsonImportBase: './locales',
      },
      runtime: { fs: rt.fs, path: rt.path },
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.plan.edits.length).toBe(2);
    const applied = await applyPatchPlanAtomic({ fs: rt.fs, path: rt.path }, planned.plan);
    expect(applied.ok).toBe(true);
    const nextLoader = fs.readFileSync(generatedPath, 'utf8');
    const nextConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
      locales: Array<{ code: string; englishName: string; nativeName: string; direction: 'ltr' | 'rtl' }>;
      extra: { untouched: boolean };
    };
    const fr = nextConfig.locales.find((row) => row.code === 'fr');
    expect(nextLoader).toContain('locales/fr.json');
    expect(nextConfig.locales.map((r) => r.code)).toEqual(['en', 'fr']);
    expect(fr?.englishName).not.toBe('fr');
    expect(fr?.nativeName).not.toBe('fr');
    expect(nextConfig.extra.untouched).toBe(true);
  });

  it('builds and applies plan for loader_generated with user island preserved', async () => {
    const root = makeTempDir();
    const i18nDir = path.join(root, 'i18n');
    const localesDir = path.join(i18nDir, 'locales');
    fs.mkdirSync(localesDir, { recursive: true });
    fs.writeFileSync(path.join(localesDir, 'en.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(localesDir, 'fr.json'), '{}', 'utf8');
    const configPath = path.join(i18nDir, 'config.json');
    const generatedPath = path.join(i18nDir, 'loaders.generated.ts');
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
    const inner = renderGeneratedInnerBlock({
      records: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
      importBase: './locales',
    });
    fs.writeFileSync(generatedPath, composeLoadersGeneratedFile(inner, '// user\n'), 'utf8');

    const rt = createNodeRuntimeAdapters();
    const planned = await buildPatchPlan({
      command: 'generate',
      action: 'upsert_locales',
      changedLocaleCodes: ['fr'],
      sourceLocaleCode: 'en',
      config: {
        enabled: true,
        recipe: 'loader_generated',
        configPath,
        loaderPath: generatedPath,
        localeJsonImportBase: './locales',
      },
      runtime: { fs: rt.fs, path: rt.path },
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.plan.recipe).toBe('loader_generated');
    expect(planned.plan.edits.length).toBe(2);
    const applied = await applyPatchPlanAtomic({ fs: rt.fs, path: rt.path }, planned.plan);
    expect(applied.ok).toBe(true);
    const gen = fs.readFileSync(generatedPath, 'utf8');
    expect(gen).toContain('locales/fr.json');
    expect(gen).toContain('const DEFAULT_LOCALE_CODE: LocaleCode = "en";');
    const nextConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { locales: { code: string }[] };
    expect(nextConfig.locales.map((r) => r.code).sort()).toEqual(['en', 'fr']);
    expect(gen).toContain('// user');
  });

  it('updates generated loader metadata for locales edit', async () => {
    const root = makeTempDir();
    const i18nDir = path.join(root, 'i18n');
    const configPath = path.join(i18nDir, 'config.json');
    const generatedPath = path.join(i18nDir, 'loaders.generated.ts');
    fs.mkdirSync(i18nDir, { recursive: true });
    const records = [
      { code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' as const },
      { code: 'ja', englishName: 'Japanese', nativeName: '日本語', direction: 'ltr' as const },
    ];
    fs.writeFileSync(`${configPath}`, `${JSON.stringify({ locales: records }, null, 2)}\n`, 'utf8');
    const inner = renderGeneratedInnerBlock({
      records,
      importBase: './locales',
      defaultLocaleCode: 'en',
    });
    fs.writeFileSync(generatedPath, composeLoadersGeneratedFile(inner, '// user\n'), 'utf8');

    const rt = createNodeRuntimeAdapters();
    const planned = await buildPatchPlan({
      command: 'locales-edit',
      action: 'upsert_locales',
      changedLocaleCodes: ['ja'],
      upsertLocaleRecords: [
        { code: 'ja', englishName: 'Japanese (custom)', nativeName: '日本語カスタム', direction: 'rtl' },
      ],
      sourceLocaleCode: 'en',
      config: {
        enabled: true,
        recipe: 'loader_generated',
        configPath,
        loaderPath: generatedPath,
        localeJsonImportBase: './locales',
      },
      runtime: { fs: rt.fs, path: rt.path },
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    const applied = await applyPatchPlanAtomic({ fs: rt.fs, path: rt.path }, planned.plan);
    expect(applied.ok).toBe(true);
    const nextConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
      locales: Array<{ code: string; englishName: string; nativeName: string; direction: string }>;
    };
    expect(nextConfig.locales.find((row) => row.code === 'ja')).toMatchObject({
      englishName: 'Japanese (custom)',
      nativeName: '日本語カスタム',
      direction: 'rtl',
    });
    const gen = fs.readFileSync(generatedPath, 'utf8');
    expect(gen).toContain('Japanese (custom)');
    expect(gen).toContain('日本語カスタム');
    expect(gen).toContain('// user');
  });

  it('restores missing source locale and rewrites invalid default locale in loader_generated', async () => {
    const root = makeTempDir();
    const i18nDir = path.join(root, 'i18n');
    const configPath = path.join(i18nDir, 'config.json');
    const generatedPath = path.join(i18nDir, 'loaders.generated.ts');
    fs.mkdirSync(i18nDir, { recursive: true });
    fs.writeFileSync(
      configPath,
      `${JSON.stringify(
        {
          locales: [
            { code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' },
            { code: 'fr', englishName: 'French', nativeName: 'Francais', direction: 'ltr' },
          ],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    fs.writeFileSync(
      generatedPath,
      [
        '// i18nprune:generated:start',
        'const DEFAULT_LOCALE_CODE = "xx" as LocaleCode;',
        '// i18nprune:generated:end',
        '',
        '// i18nprune:user:start',
        '// keep me',
        '// i18nprune:user:end',
        '',
      ].join('\n'),
      'utf8',
    );

    const rt = createNodeRuntimeAdapters();
    const planned = await buildPatchPlan({
      command: 'sync',
      action: 'delete_locales',
      changedLocaleCodes: ['en'],
      sourceLocaleCode: 'en',
      config: {
        enabled: true,
        recipe: 'loader_generated',
        configPath,
        loaderPath: generatedPath,
        localeJsonImportBase: './locales',
      },
      runtime: { fs: rt.fs, path: rt.path },
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.diagnostics.some((d) => d.code === 'i18nprune.patching.source_locale_restored')).toBe(true);
    const applied = await applyPatchPlanAtomic({ fs: rt.fs, path: rt.path }, planned.plan);
    expect(applied.ok).toBe(true);

    const nextConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { locales: Array<{ code: string }> };
    expect(nextConfig.locales.map((r) => r.code)).toContain('en');
    const gen = fs.readFileSync(generatedPath, 'utf8');
    expect(gen).toContain('const DEFAULT_LOCALE_CODE: LocaleCode = "en";');
    expect(gen).toContain('// keep me');
  });

  it('rolls back committed edits when apply fails mid-flight', async () => {
    const failingRuntime: PatchingRuntimePorts = {
      path: path,
      fs: {
        exists: () => true,
        readText: () => '',
        statKind: () => 'file',
        listDir: () => [],
        writeText: (() => {
          let writes = 0;
          const state = new Map<string, string>();
          return (filePath: string, content: string) => {
            writes += 1;
            if (writes === 2) throw new Error('boom');
            state.set(filePath, content);
          };
        })(),
        deleteFile: () => {},
        mkdirp: () => {},
      },
    };
    const plan: PatchingPlan = {
      recipe: 'loader_generated',
      action: 'upsert_locales',
      changedLocaleCodes: ['fr'],
      edits: [
        { path: '/tmp/a', before: 'before-a', after: 'after-a', kind: 'config' },
        { path: '/tmp/b', before: 'before-b', after: 'after-b', kind: 'generated' },
      ],
    };
    const out = await applyPatchPlanAtomic(failingRuntime, plan);
    expect(out.ok).toBe(false);
    expect(out.diagnostics.some((d) => d.code === 'i18nprune.patching.apply_failed')).toBe(true);
  });

  it('resolves missing locale metadata and reports catalog mismatches', () => {
    const raw = JSON.stringify(
      {
        locales: [
          { code: 'en', englishName: 'English', nativeName: 'English' },
          { code: 'fr', englishName: 'French (custom)', nativeName: 'francais', direction: 'rtl' },
        ],
      },
      null,
      2,
    );
    const out = resolvePatchingConfigLocales(raw, { applyCatalogMismatches: false });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.autofilled.some((x) => x.code === 'en' && x.field === 'direction')).toBe(true);
    expect(out.mismatches.some((x) => x.code === 'fr' && x.field === 'direction')).toBe(true);
    const applied = resolvePatchingConfigLocales(raw, { applyCatalogMismatches: true });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.nextConfigText).toContain('"direction": "ltr"');
  });

  it('analyzes locale file drift using generated loader import base path', async () => {
    const root = makeTempDir();
    const i18nDir = path.join(root, 'src', 'i18n');
    const localesDir = path.join(root, 'locales');
    fs.mkdirSync(i18nDir, { recursive: true });
    fs.mkdirSync(localesDir, { recursive: true });
    fs.writeFileSync(path.join(localesDir, 'en.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(localesDir, 'fr.json'), '{}', 'utf8');
    fs.writeFileSync(
      path.join(i18nDir, 'config.json'),
      `${JSON.stringify(
        {
          locales: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    fs.writeFileSync(path.join(i18nDir, 'loaders.generated.ts'), '', 'utf8');

    const rt = createNodeRuntimeAdapters();
    const analyzed = await analyzePatchingState({
      command: 'generate',
      action: 'upsert_locales',
      changedLocaleCodes: [],
      config: {
        enabled: true,
        recipe: 'loader_generated',
        configPath: path.join(i18nDir, 'config.json'),
        loaderPath: path.join(i18nDir, 'loaders.generated.ts'),
        localeJsonImportBase: 'locales',
      },
      projectRoot: root,
      runtime: { fs: rt.fs, path: rt.path },
    });
    expect(analyzed.fileOnlyCodes).toContain('fr');
    expect(analyzed.configOnlyCodes).toEqual([]);
  });

  it('ignores locale meta json files in config-vs-file drift analysis', async () => {
    const root = makeTempDir();
    const i18nDir = path.join(root, 'src', 'i18n');
    const localesDir = path.join(root, 'locales');
    fs.mkdirSync(i18nDir, { recursive: true });
    fs.mkdirSync(localesDir, { recursive: true });
    fs.writeFileSync(path.join(localesDir, 'en.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(localesDir, 'ar.meta.json'), '{"meta":true}', 'utf8');
    fs.writeFileSync(
      path.join(i18nDir, 'config.json'),
      `${JSON.stringify(
        {
          locales: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    fs.writeFileSync(path.join(i18nDir, 'loaders.generated.ts'), '', 'utf8');

    const rt = createNodeRuntimeAdapters();
    const analyzed = await analyzePatchingState({
      command: 'generate',
      action: 'upsert_locales',
      changedLocaleCodes: [],
      config: {
        enabled: true,
        recipe: 'loader_generated',
        configPath: path.join(i18nDir, 'config.json'),
        loaderPath: path.join(i18nDir, 'loaders.generated.ts'),
        localeJsonImportBase: 'locales',
      },
      projectRoot: root,
      runtime: { fs: rt.fs, path: rt.path },
    });
    expect(analyzed.fileOnlyCodes).toEqual([]);
    expect(analyzed.diagnostics.some((d) => d.message.includes('ar.meta'))).toBe(false);
  });

  it('does not emit catalog direction mismatch with undefined recommended value', () => {
    const out = resolvePatchingConfigLocales(
      JSON.stringify({
        locales: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
      }),
      { applyCatalogMismatches: false },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.mismatches.some((m) => m.field === 'direction' && m.recommended === 'undefined')).toBe(false);
  });

  it('analyzes generated-loader recipe without requiring user loader bridge file', async () => {
    const root = makeTempDir();
    const i18nDir = path.join(root, 'i18n');
    const localesDir = path.join(i18nDir, 'locales');
    fs.mkdirSync(localesDir, { recursive: true });
    fs.writeFileSync(path.join(localesDir, 'en.json'), '{}', 'utf8');
    fs.writeFileSync(
      path.join(i18nDir, 'config.json'),
      `${JSON.stringify(
        {
          locales: [{ code: 'en', englishName: 'English', nativeName: 'English', direction: 'ltr' }],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    fs.writeFileSync(path.join(i18nDir, 'loaders.generated.ts'), '', 'utf8');

    const rt = createNodeRuntimeAdapters();
    const analyzed = await analyzePatchingState({
      command: 'generate',
      action: 'upsert_locales',
      changedLocaleCodes: [],
      config: {
        enabled: true,
        recipe: 'loader_generated',
        configPath: path.join(i18nDir, 'config.json'),
        loaderPath: path.join(i18nDir, 'loaders.generated.ts'),
        localeJsonImportBase: 'i18n/locales',
      },
      projectRoot: root,
      runtime: { fs: rt.fs, path: rt.path },
    });
    expect(analyzed.hasError).toBe(false);
  });

  it('analyzePatchingState warns on incomplete patching block when treatAsPatchRequested', async () => {
    const rt = createNodeRuntimeAdapters();
    const analyzed = await analyzePatchingState({
      command: 'generate',
      action: 'upsert_locales',
      changedLocaleCodes: [],
      config: { enabled: false, recipe: 'loader_generated', mode: 'warn_skip' },
      runtime: { fs: rt.fs, path: rt.path },
      treatAsPatchRequested: true,
    });
    expect(analyzed.diagnostics.some((d) => d.code === ISSUE_PATCHING_CONFIG_SECTION_INCOMPLETE)).toBe(true);
  });
});
