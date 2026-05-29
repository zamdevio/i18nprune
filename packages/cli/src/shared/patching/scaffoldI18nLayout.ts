import { resolveConfigFilePath } from '@/shared/config/index.js';
import type { Context } from '@/types/core/context/index.js';
import {
  buildLanguageCatalog,
  composeLoadersGeneratedFile,
  generatedLanguageCatalog,
  getLanguageByCodeFromCatalog,
  languageOftenRtl,
  listLocaleCodes,
  renderGeneratedInnerBlock,
  resolveLocalesLayout,
  resolvePatchingLocaleImportSpec,
  sourceLocaleCodeForLayout,
  type PatchingLocaleRecord,
} from '@i18nprune/core';

/**
 * Canonical on-disk layout under **`<src>/i18n/`** for **`patch --init`**.
 *
 * **`patching.loaderPath`** in **`i18nprune` config** must match **`loaderPath`** here (the generated
 * **`loaders.generated.ts`** module). **`patch --init`** does not create or manage any separate
 * **`loader.ts`**; add your own integration file if you want (see **`docs/patching/loader.md`**).
 */
export function resolvePatchScaffoldPaths(ctx: Context): {
  i18nDir: string;
  configPath: string;
  /** **`loaders.generated.ts`** — same file as **`patching.loaderPath`** in config. */
  loaderPath: string;
} {
  const { path } = ctx.adapters;
  const i18nDir = path.join(ctx.paths.srcRoot, 'i18n');
  return {
    i18nDir,
    configPath: path.join(i18nDir, 'config.json'),
    loaderPath: path.join(i18nDir, 'loaders.generated.ts'),
  };
}

export function computeLocaleJsonImportBase(ctx: Context, loaderPath: string): string {
  const rel = ctx.adapters.path.relative(ctx.adapters.path.dirname(loaderPath), ctx.paths.localesDir);
  return rel.replace(/\\/g, '/') || '.';
}

/**
 * Value to store in **`patching.localeJsonImportBase`**: path to the locale directory **relative to the
 * i18nprune config file’s directory** (project root when the config sits in the repo root).
 */
export function patchingLocaleJsonImportBaseForProjectConfig(ctx: Context, configFilePath: string): string {
  const root = ctx.adapters.path.dirname(configFilePath);
  const rel = ctx.adapters.path.relative(root, ctx.paths.localesDir).replace(/\\/g, '/');
  if (rel && !rel.startsWith('..') && !ctx.adapters.path.isAbsolute(rel)) {
    return rel;
  }
  return ctx.config.locales.directory.replace(/\\/g, '/');
}

/** Directory that holds `i18nprune.config.*` — used as patching `projectRoot` for path resolution (same as cwd when the config sits in the repo root). */
export function resolvePatchingProjectRoot(ctx: Context): string {
  const cfgPath = resolveConfigFilePath(ctx.adapters.system.cwd());
  if (cfgPath) return ctx.adapters.path.dirname(cfgPath);
  return ctx.adapters.system.cwd();
}

export function collectLocaleCodesFromDisk(ctx: Context): string[] {
  const layout = resolveLocalesLayout(ctx.config.locales, ctx.paths.localesDir);
  if (layout.mode === 'flat_file' && layout.structure === 'locale_file') {
    const entries = ctx.adapters.fs.listDir(ctx.paths.localesDir);
    const codes = (Array.isArray(entries) ? entries : [])
      .filter((e) => e.kind === 'file' && e.name.endsWith('.json'))
      .map((e) => e.name.slice(0, -5));
    return [...new Set(codes)].sort();
  }
  return listLocaleCodes({
    layout,
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
  }).codes;
}

function sourceLocaleCode(ctx: Context): string {
  const layout = resolveLocalesLayout(ctx.config.locales, ctx.paths.localesDir);
  return sourceLocaleCodeForLayout({
    layout,
    path: ctx.adapters.path,
    sourceLocaleAbsolute: ctx.paths.sourceLocale,
  });
}

export function buildLocaleRecordsForScaffold(ctx: Context): PatchingLocaleRecord[] {
  const catalog = buildLanguageCatalog(generatedLanguageCatalog);
  const codes = collectLocaleCodesFromDisk(ctx);
  const source = sourceLocaleCode(ctx);
  const ordered = [...new Set([source, ...codes.filter((c) => c !== source)])];
  return ordered.map((code) => {
    const cat = getLanguageByCodeFromCatalog(catalog, code);
    if (!cat) {
      return { code, englishName: code, nativeName: code, direction: 'ltr' as const };
    }
    return {
      code,
      englishName: cat.english,
      nativeName: cat.native,
      direction:
        cat.direction === 'ltr' || cat.direction === 'rtl'
          ? cat.direction
          : languageOftenRtl(code)
            ? 'rtl'
            : 'ltr',
    };
  });
}

export function buildScaffoldFileContents(ctx: Context): {
  configText: string;
  generatedText: string;
  localeJsonImportBase: string;
} {
  const paths = resolvePatchScaffoldPaths(ctx);
  const localeJsonImportBase = computeLocaleJsonImportBase(ctx, paths.loaderPath);
  const records = buildLocaleRecordsForScaffold(ctx);
  const configText = `${JSON.stringify({ locales: records }, null, 2)}\n`;
  const sourceCode = sourceLocaleCode(ctx);
  const layout = resolveLocalesLayout(ctx.config.locales, ctx.paths.localesDir);
  const localeImportSpec = resolvePatchingLocaleImportSpec({
    layout,
    runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
    localesDir: ctx.paths.localesDir,
    sourceLocaleCode: sourceCode,
  });
  const inner = renderGeneratedInnerBlock({
    records,
    importBase: localeJsonImportBase,
    defaultLocaleCode: sourceCode,
    localeImportSpec,
  });
  const generatedText = composeLoadersGeneratedFile(inner, '// Optional: add small helpers or re-exports here.\n');
  return { configText, generatedText, localeJsonImportBase };
}
