import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dir, '../..');
const uiRoot = path.join(repoRoot, 'packages/ui/src');

export default defineConfig({
  root: dir,
  publicDir: path.join(dir, 'public'),
  plugins: [react()],
  resolve: {
    alias: {
      '@i18nprune/ui/react/toolbar': path.join(uiRoot, 'react/toolbar/index.ts'),
      '@i18nprune/ui/react/pagination': path.join(uiRoot, 'react/pagination/index.ts'),
      '@i18nprune/ui/types/toolbar': path.join(uiRoot, 'types/toolbar/index.ts'),
      '@i18nprune/ui/types/pagination': path.join(uiRoot, 'types/pagination/index.ts'),
    },
  },
  server: {
    port: 5190,
  },
  build: {
    outDir: path.resolve(dir, 'dist'),
  },
});
