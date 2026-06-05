import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectIndexSeoPlugin, syncWebAssetsPlugin, writeRobotsTxtPlugin } from '@i18nprune/seo/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  plugins: [
    react(),
    writeRobotsTxtPlugin({ preset: 'landing', publicDir: path.join(dir, 'public') }),
    syncWebAssetsPlugin({
      surface: 'landing',
      publicDir: path.join(dir, 'public'),
      functionsDir: path.join(dir, 'functions'),
    }),
    injectIndexSeoPlugin({ surface: 'landing' }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          const match = id.match(
            /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@[^/]+\/[^/]+|[^/]+)/,
          );
          const pkg = match?.[1];
          if (!pkg) return undefined;
          if (pkg === 'motion' || pkg === 'shiki') return undefined;
          return `vendor-${pkg.replace('@', '').replace('/', '-')}`;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(dir, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
