import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectIndexSeoPlugin, syncWebAssetsPlugin, writeRobotsTxtPlugin } from '@i18nprune/seo/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dir, '../..');

export default defineConfig({
  plugins: [
    react(),
    writeRobotsTxtPlugin({ preset: 'web', publicDir: path.join(dir, 'public') }),
    syncWebAssetsPlugin({
      surface: 'web',
      publicDir: path.join(dir, 'public'),
      functionsDir: path.join(dir, 'functions'),
    }),
    injectIndexSeoPlugin({ surface: 'web' }),
  ],
  appType: 'spa',
  publicDir: path.join(dir, 'public'),
  resolve: {
    alias: {
      '@i18nprune/ui/react/theme': path.join(repoRoot, 'packages/ui/src/react/theme/index.ts'),
      '@i18nprune/ui/react/toolbar': path.join(repoRoot, 'packages/ui/src/react/toolbar/index.ts'),
      '@i18nprune/ui/react/overlay': path.join(repoRoot, 'packages/ui/src/react/overlay/index.ts'),
      '@i18nprune/ui/react/pagination': path.join(repoRoot, 'packages/ui/src/react/pagination/index.ts'),
      '@i18nprune/ui/utils/clipboard': path.join(repoRoot, 'packages/ui/src/utils/clipboard/index.ts'),
      '@i18nprune/ui/react/surfaces': path.join(repoRoot, 'packages/ui/src/react/surfaces/index.ts'),
      '@i18nprune/ui/react/nav': path.join(repoRoot, 'packages/ui/src/react/nav/index.ts'),
    },
  },
  server: {
    port: 5178,
  },
});
