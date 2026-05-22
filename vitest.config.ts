import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: [
      'packages/core/src/**/__tests__/**/*.test.ts',
      'packages/cli/src/**/__tests__/**/*.test.ts',
      'apps/report/src/**/__tests__/**/*.test.ts',
      'apps/workers/i18nprune/src/**/__tests__/**/*.test.ts',
      'tests/**/__tests__/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/parity/**/*.test.ts',
    ],
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'packages/cli/src') },
      {
        find: '@i18nprune/core/runtime/node',
        replacement: path.resolve(__dirname, 'packages/core/src/runtime/exports/node.ts'),
      },
      {
        find: '@i18nprune/core/runtime/web',
        replacement: path.resolve(__dirname, 'packages/core/src/runtime/exports/web.ts'),
      },
      {
        find: '@i18nprune/core/runtime/edge',
        replacement: path.resolve(__dirname, 'packages/core/src/runtime/exports/edge.ts'),
      },
      {
        find: /^@i18nprune\/core\/(.+)$/,
        replacement: path.resolve(__dirname, 'packages/core/src/$1'),
      },
      {
        find: '@i18nprune/core',
        replacement: path.resolve(__dirname, 'packages/core/src/index.ts'),
      },
      {
        find: '@i18nprune/report',
        replacement: path.resolve(__dirname, 'packages/report/src/index.ts'),
      },
    ],
  },
});