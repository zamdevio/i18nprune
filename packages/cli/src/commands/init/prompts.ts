import { confirm, select } from '@inquirer/prompts';
import type { InitConfigFormat } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import { CLI_NAME, CONFIG_BASE_NAME } from '@/constants/cli.js';
import { duringPrompt } from '@/utils/timer/index.js';

export async function promptConfigFormat(run?: RunOptions): Promise<InitConfigFormat> {
  logger.decorative.dim(`  No ${CLI_NAME} config found. Choose a starter file (TypeScript or JavaScript).`, run);
  return duringPrompt(() =>
    select({
      message: 'Config file',
      choices: [
        { value: 'ts' as const, name: `${CONFIG_BASE_NAME}.ts` },
        { value: 'mts' as const, name: `${CONFIG_BASE_NAME}.mts` },
        { value: 'js' as const, name: `${CONFIG_BASE_NAME}.js (ESM)` },
        { value: 'mjs' as const, name: `${CONFIG_BASE_NAME}.mjs` },
      ],
    }),
  );
}

export async function confirmWriteConfig(filePath: string): Promise<boolean> {
  return duringPrompt(() =>
    confirm({
      message: `Create ${filePath}?`,
      default: true,
    }),
  );
}
