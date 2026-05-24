import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dir, '../..');

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  resolve: {
    alias: {
      '@i18nprune/ui/react/theme': path.join(repoRoot, 'packages/ui/src/react/theme/index.ts'),
      '@i18nprune/ui/react/toolbar': path.join(repoRoot, 'packages/ui/src/react/toolbar/index.ts'),
      '@i18nprune/ui/utils/clipboard': path.join(repoRoot, 'packages/ui/src/utils/clipboard/index.ts'),
    },
  },
  server: {
    port: 5178,
  },
});
