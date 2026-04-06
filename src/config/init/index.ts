import fs from 'node:fs';
import path from 'node:path';
import { resolveConfigFilePath } from '@/config/resolve/scan.js';
import { CONFIG_BASE_NAME } from '@/constants/cli.js';
import { getRunOptions } from '@/core/runtime/options.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';
import { logger } from '@/utils/logger/index.js';
import { confirmWriteConfig, promptConfigFormat } from '@/config/init/prompts.js';
import type { ConfigFormat } from '@/types/config/init/index.js';
import type { EnsureConfigOptions } from '@/types/config/init/index.js';

const CONFIG_TEMPLATE = `import { defineConfig } from '@zamdevio/i18nprune/config';

export default defineConfig({
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  policies: {
    preserve: {},
    parity: {},
  },
});
`;

const FILE_FOR_FORMAT: Record<ConfigFormat, string> = {
  ts: `${CONFIG_BASE_NAME}.ts`,
  mts: `${CONFIG_BASE_NAME}.mts`,
  js: `${CONFIG_BASE_NAME}.js`,
  mjs: `${CONFIG_BASE_NAME}.mjs`,
};

export type { EnsureConfigOptions };

export async function ensureConfig(opts: EnsureConfigOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const existing = resolveConfigFilePath(cwd);
  if (existing) {
    if (!opts.silentIfExists) {
      const rel = path.relative(cwd, existing);
      const display = rel && !rel.startsWith('..') ? rel : existing;
      logger.info(`Config already exists (${display}) — nothing to create.`, getRunOptions());
    }
    return;
  }
  if (shouldSkipInteractivePrompts() || opts.yes) {
    const target = path.join(cwd, FILE_FOR_FORMAT.ts);
    if (!fs.existsSync(target)) {
      fs.writeFileSync(target, CONFIG_TEMPLATE, 'utf8');
      logger.info(`Wrote default ${target}`);
    }
    return;
  }

  const fmt = await promptConfigFormat(getRunOptions());
  const fileName = FILE_FOR_FORMAT[fmt];
  const target = path.join(cwd, fileName);
  if (!(await confirmWriteConfig(fileName))) {
    logger.warn('Skipping config file; using built-in defaults for this run.');
    return;
  }
  fs.writeFileSync(target, CONFIG_TEMPLATE, 'utf8');
  logger.info(`Created ${target}`);
}
