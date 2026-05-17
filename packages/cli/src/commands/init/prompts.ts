import { confirm, select } from '@inquirer/prompts';
import type { InitConfigFormat, InitPresetId } from '@i18nprune/core';
import { INIT_PRESET_IDS } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import { CLI_NAME, CONFIG_BASE_NAME } from '@/constants/cli.js';
import { duringPrompt } from '@/utils/timer/index.js';

const INIT_PRESET_LABELS: Record<InitPresetId, string> = {
  generic: 'generic — neutral defaults (locales/en.json)',
  i18next: 'i18next — locales + t / i18n.t',
  lingui: 'Lingui — locales + t / Trans',
  'next-i18next': 'next-i18next — public/locales + useTranslation',
  'next-intl': 'next-intl — messages/ + useTranslations',
  'react-intl': 'react-intl — locales + useIntl / FormattedMessage',
};

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

/** After **`--auto`** is ambiguous, let the user pick a preset (**`generic` listed first**). */
export async function promptInitPresetAfterAmbiguousAuto(run?: RunOptions): Promise<InitPresetId> {
  logger.decorative.dim('  Auto-detect could not pick a unique preset. Choose a starter bundle.', run);
  const choices = INIT_PRESET_IDS.map((value) => ({
    value,
    name: INIT_PRESET_LABELS[value],
  }));
  return duringPrompt(() =>
    select({
      message: 'Starter preset',
      choices,
    }),
  );
}
