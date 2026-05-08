import path from 'node:path';
import {
  buildInitConfigTemplate,
  configFileNameForFormat,
  defaultInitConfigFileName,
} from '@i18nprune/core';
import { resolveConfigFilePath } from '@/shared/config/index.js';
import { CONFIG_BASE_NAME } from '@/constants/cli.js';
import { getRunOptions } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { existsRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';
import { getArgvJsonFlag } from '@/shared/context/globals.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';
import { logger } from '@/utils/logger/index.js';
import { confirmWriteConfig, promptConfigFormat } from '@/commands/init/prompts.js';
import type { EnsureConfigOptions } from '@/types/config/init.js';

export type { EnsureConfigOptions };

export async function ensureConfig(opts: EnsureConfigOptions = {}): Promise<void> {
  const adapters = createNodeRuntimeAdapters();
  const fs = adapters.fs;
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
  const nonInteractiveInit = shouldSkipInteractivePrompts() || opts.yes || getArgvJsonFlag();
  if (nonInteractiveInit) {
    const target = path.join(cwd, defaultInitConfigFileName(CONFIG_BASE_NAME));
    if (!existsRuntimeFsSync(target, fs)) {
      await Promise.resolve(fs.writeText(target, buildInitConfigTemplate({ rich: opts.rich })));
      logger.info(`Wrote default ${target}`);
    }
    return;
  }

  const fmt = await promptConfigFormat(getRunOptions());
  const fileName = configFileNameForFormat(CONFIG_BASE_NAME, fmt);
  const target = path.join(cwd, fileName);
  if (!(await confirmWriteConfig(fileName))) {
    logger.warn('Skipping config file; using built-in defaults for this run.');
    return;
  }
  await Promise.resolve(fs.writeText(target, buildInitConfigTemplate({ rich: opts.rich })));
  logger.info(`Created ${target}`);
}
