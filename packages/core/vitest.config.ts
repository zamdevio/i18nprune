import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: [
      {
        find: '@i18nprune/core/runtime/node',
        replacement: path.resolve(__dirname, 'src/runtime/exports/node.ts'),
      },
      {
        find: '@i18nprune/core/runtime/web',
        replacement: path.resolve(__dirname, 'src/runtime/exports/web.ts'),
      },
      {
        find: '@i18nprune/core/runtime/edge',
        replacement: path.resolve(__dirname, 'src/runtime/exports/edge.ts'),
      },
      {
        find: /^@i18nprune\/core\/(.+)$/,
        replacement: path.resolve(__dirname, 'src/$1'),
      },
      {
        find: '@i18nprune/core',
        replacement: path.resolve(__dirname, 'src/index.ts'),
      },
    ],
  },
});
