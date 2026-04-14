import fs from 'node:fs';
import path from 'node:path';
import { input, confirm, select } from '@inquirer/prompts';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { logger } from '@/utils/logger/index.js';

export async function promptLanguageCodeOnly(run?: RunOptions): Promise<string> {
  logger.decorative.dim('  Target BCP47 code (e.g. ja, pt-br).', run);
  return input({ message: 'Language code', validate: (v) => (v.trim() ? true : 'Required') });
}

export async function promptMetaLocaleDetails(
  defaults: { englishName: string; nativeName: string; direction: 'ltr' | 'rtl' },
  run?: RunOptions,
): Promise<{
  englishName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}> {
  logger.decorative.dim(
    '  English label, native endonym, and text direction for .meta.json (Enter = catalog defaults).',
    run,
  );
  const englishName = await input({
    message: 'English name',
    default: defaults.englishName,
    validate: (v) => (v.trim() ? true : 'Required'),
  });
  const nativeName = await input({
    message: 'Native name',
    default: defaults.nativeName,
    validate: (v) => (v.trim() ? true : 'Required'),
  });
  const direction = await select({
    message: 'Direction',
    choices: [
      { value: 'ltr' as const, name: 'ltr — left-to-right' },
      { value: 'rtl' as const, name: 'rtl — right-to-left' },
    ],
    default: defaults.direction,
  });
  return { englishName, nativeName, direction };
}

export async function promptFullRetranslate(): Promise<boolean> {
  return confirm({ message: 'Target already complete. Re-translate all string leaves?', default: false });
}

export function printGenerateSessionBanner(run?: RunOptions): void {
  logger.decorative.dim('  Translating string leaves (nested shape preserved)…', run);
}
