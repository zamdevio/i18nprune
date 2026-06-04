import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dir, '../..');
const uiRoot = path.join(repoRoot, 'packages/ui/src');

export default defineConfig({
  root: dir,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dir, './src'),
      '@i18nprune/ui/react/theme': path.join(uiRoot, 'react/theme/index.ts'),
      '@i18nprune/ui/react/pagination': path.join(uiRoot, 'react/pagination/index.ts'),
      '@i18nprune/ui/react/toolbar': path.join(uiRoot, 'react/toolbar/index.ts'),
      '@i18nprune/ui/utils/clipboard': path.join(uiRoot, 'utils/clipboard/index.ts'),
      '@i18nprune/ui/styles/tokens.css': path.join(uiRoot, 'styles/tokens.css'),
      '@i18nprune/ui/styles/runtime.css': path.join(uiRoot, 'styles/runtime.css'),
    },
  },
  server: {
    port: 5180,
  },
});
