import { confirm, select } from '@inquirer/prompts';
import type { RunOptions } from '@/types/core/runtime/index.js';
import type { ConfigFormat } from '@/types/config/init/index.js';
import { logger } from '@/utils/logger/index.js';

export async function promptConfigFormat(run?: RunOptions): Promise<ConfigFormat> {
  logger.decorative.dim('  No i18nprune config found. Choose a starter file (TypeScript or JavaScript).', run);
  return select({
    message: 'Config file',
    choices: [
      { value: 'ts' as const, name: 'i18nprune.config.ts' },
      { value: 'mts' as const, name: 'i18nprune.config.mts' },
      { value: 'js' as const, name: 'i18nprune.config.js (ESM)' },
      { value: 'mjs' as const, name: 'i18nprune.config.mjs' },
    ],
  });
}

export async function confirmWriteConfig(filePath: string): Promise<boolean> {
  return confirm({
    message: `Create ${filePath}?`,
    default: true,
  });
}
