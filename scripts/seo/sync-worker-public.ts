import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { syncWebPublicAssets } from '@i18nprune/seo/assets/sync';
import type { WebManifestSurface } from '@i18nprune/seo';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const targets: Array<{ surface: WebManifestSurface; publicDir: string }> = [
  { surface: 'worker', publicDir: resolve(repoRoot, 'apps/workers/i18nprune/public') },
  { surface: 'meta', publicDir: resolve(repoRoot, 'apps/workers/meta/public') },
];

for (const { surface, publicDir } of targets) {
  syncWebPublicAssets({ surface, publicDir });
}
