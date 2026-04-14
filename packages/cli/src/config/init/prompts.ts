import { confirm, select } from '@inquirer/prompts';
import type { RunOptions } from '@/types/core/runtime/index.js';
import type { ConfigFormat } from '@/types/config/init/index.js';
import { logger } from '@/utils/logger/index.js';
import { CLI_NAME, CONFIG_BASE_NAME } from '@/constants/cli.js';

export async function promptConfigFormat(run?: RunOptions): Promise<ConfigFormat> {
  logger.decorative.dim(`  No ${CLI_NAME} config found. Choose a starter file (TypeScript or JavaScript).`, run);
  return select({
    message: 'Config file',
    choices: [
      { value: 'ts' as const, name: `${CONFIG_BASE_NAME}.ts` },
      { value: 'mts' as const, name: `${CONFIG_BASE_NAME}.mts` },
      { value: 'js' as const, name: `${CONFIG_BASE_NAME}.js (ESM)` },
      { value: 'mjs' as const, name: `${CONFIG_BASE_NAME}.mjs` },
    ],
  });
}

export async function confirmWriteConfig(filePath: string): Promise<boolean> {
  return confirm({
    message: `Create ${filePath}?`,
    default: true,
  });
}
