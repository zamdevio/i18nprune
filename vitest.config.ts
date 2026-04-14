import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: [
      'packages/cli/src/**/__tests__/**/*.test.ts',
      'apps/report/src/**/__tests__/**/*.test.ts',
      'tests/**/__tests__/**/*.test.ts',
      'tests/integration/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'packages/cli/src'),
      '@zamdevio/i18nprune/report': path.resolve(
        __dirname,
        'packages/report/src/index.ts',
      ),
    },
  },
});
