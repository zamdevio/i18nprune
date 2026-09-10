import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { vitestAliasEntries } from './scripts/dev/pathAliases.mjs';

/** PR-only: Vitest annotations in GitHub Actions. */
const prCiGithubActionsReporter =
  process.env.GITHUB_ACTIONS === 'true' &&
  process.env.GITHUB_EVENT_NAME === 'pull_request';

/** Push to main on GHA: keep default reporter only (no PR annotations). */
const pushCiDefaultReporterOnly =
  process.env.GITHUB_ACTIONS === 'true' &&
  process.env.GITHUB_EVENT_NAME !== 'pull_request';

/** Parity/integration spawn `dist/cli.js`; Windows runners often exceed Vitest’s 5s default. */
const testTimeoutMs = process.platform === 'win32' ? 30_000 : 5_000;

export default defineConfig({
  test: {
    setupFiles: [path.resolve(__dirname, 'tests/setup/vitestEnv.ts')],
    testTimeout: testTimeoutMs,
    ...(prCiGithubActionsReporter
      ? { reporters: ['default', 'github-actions'] as const }
      : pushCiDefaultReporterOnly
        ? { reporters: ['default'] as const }
        : {}),
    include: [
      'packages/core/src/**/__tests__/**/*.test.ts',
      'packages/cli/src/**/__tests__/**/*.test.ts',
      'packages/seo/src/**/__tests__/**/*.test.ts',
      'apps/report/src/**/__tests__/**/*.test.ts',
      'apps/workers/i18nprune/src/**/__tests__/**/*.test.ts',
      'apps/git/scripts/**/__tests__/**/*.test.ts',
      'tests/**/__tests__/**/*.test.ts',
      'tests/publish-types/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/parity/**/*.test.ts',
    ],
  },
  resolve: {
    alias: vitestAliasEntries(),
  },
});
