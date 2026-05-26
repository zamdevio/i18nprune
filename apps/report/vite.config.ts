import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dir, '../..');

export default defineConfig({
  root: dir,
  resolve: {
    alias: {
      // Subpaths must be listed before the package root alias (Vite matches `@i18nprune/core` as a prefix).
      '@i18nprune/core/runtime/web': path.join(
        repoRoot,
        'packages/core/src/runtime/exports/web.ts',
      ),
      '@i18nprune/core': path.join(
        repoRoot,
        'packages/core/src/index.ts',
      ),
      '@i18nprune/report-schema': path.join(
        repoRoot,
        'packages/report/src/index.ts',
      ),
      'i18nprune/constants': path.join(
        repoRoot,
        'packages/cli/src/constants/index.ts',
      ),
      '@i18nprune/ui/react/theme': path.join(
        repoRoot,
        'packages/ui/src/react/theme/index.ts',
      ),
      '@i18nprune/ui/react/toolbar': path.join(
        repoRoot,
        'packages/ui/src/react/toolbar/index.ts',
      ),
      '@i18nprune/ui/react/pagination': path.join(
        repoRoot,
        'packages/ui/src/react/pagination/index.ts',
      ),
      '@i18nprune/ui/react/overlay': path.join(
        repoRoot,
        'packages/ui/src/react/overlay/index.ts',
      ),
      '@i18nprune/ui/react/surfaces': path.join(
        repoRoot,
        'packages/ui/src/react/surfaces/index.ts',
      ),
      '@i18nprune/ui/react/nav': path.join(repoRoot, 'packages/ui/src/react/nav/index.ts'),
      '@i18nprune/ui/types/surfaces': path.join(repoRoot, 'packages/ui/src/types/surfaces/index.ts'),
      '@i18nprune/ui/types/nav': path.join(repoRoot, 'packages/ui/src/types/nav/index.ts'),
      '@i18nprune/ui/utils/clipboard': path.join(
        repoRoot,
        'packages/ui/src/utils/clipboard/index.ts',
      ),
      '@i18nprune/ui/types/pagination': path.join(
        repoRoot,
        'packages/ui/src/types/pagination/index.ts',
      ),
      '@i18nprune/ui/types/theme': path.join(
        repoRoot,
        'packages/ui/src/types/theme/index.ts',
      ),
    },
  },
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: path.resolve(dir, 'dist'),
    cssCodeSplit: false,
  },
});
