import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSiteWebManifest } from '../manifest.js';
import type { WebManifestSurface } from '../manifest.js';

const SHARED_OG_FUNCTION_FILES = ['og.svg.ts', 'og.png.ts'] as const;

/** `packages/seo/` from this module (`dist/assets/sync.js` or `src/assets/sync.ts`). */
function seoPackageRoot(fromUrl: string): string {
  const moduleDir = dirname(fileURLToPath(fromUrl));
  return join(moduleDir, '../..');
}

const PKG_ROOT = seoPackageRoot(import.meta.url);
const ASSETS_ROOT = join(PKG_ROOT, 'assets');
const FUNCTIONS_ROOT = join(PKG_ROOT, 'functions');

/** Copy shared OG Pages Function sources into a host `functions/` dir. */
export function syncPagesFunctions(functionsDir: string): void {
  mkdirSync(functionsDir, { recursive: true });
  for (const file of SHARED_OG_FUNCTION_FILES) {
    cpSync(join(FUNCTIONS_ROOT, file), join(functionsDir, file), { force: true });
  }
}

/** Copy shared favicons, OG fonts, and surface-specific `site.webmanifest` into a host `public/` dir. */
export function syncWebPublicAssets(options: {
  surface: WebManifestSurface;
  publicDir: string;
  functionsDir?: string;
}): void {
  const favDir = join(ASSETS_ROOT, 'favicon');
  for (const file of readdirSync(favDir)) {
    cpSync(join(favDir, file), join(options.publicDir, file), { force: true });
  }

  const ogFontsSrc = join(ASSETS_ROOT, 'fonts', 'og');
  const ogFontsDest = join(options.publicDir, 'fonts', 'og');
  mkdirSync(ogFontsDest, { recursive: true });
  for (const file of readdirSync(ogFontsSrc)) {
    cpSync(join(ogFontsSrc, file), join(ogFontsDest, file), { force: true });
  }

  writeFileSync(
    join(options.publicDir, 'site.webmanifest'),
    `${JSON.stringify(buildSiteWebManifest(options.surface), null, 2)}\n`,
    'utf8',
  );

  if (options.functionsDir) {
    syncPagesFunctions(options.functionsDir);
  }
}
