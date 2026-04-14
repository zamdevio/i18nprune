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
      '@zamdevio/i18nprune/report': path.join(
        repoRoot,
        'packages/report/src/index.ts',
      ),
      'i18nprune/constants': path.join(
        repoRoot,
        'packages/cli/src/constants/index.ts',
      ),
    },
  },
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: path.resolve(dir, 'dist'),
    cssCodeSplit: false,
  },
});
