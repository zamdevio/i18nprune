import fs from 'node:fs';
import path from 'node:path';
import { input, confirm, select } from '@inquirer/prompts';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { logger } from '@/utils/logger/index.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';
import { ALL_LANG_TOKEN } from '@/utils/cli/args.js';

/** True when interactive prompts for generate may run (TTY, not CI/pipe, not structured JSON stdout). */
export function canPromptGenerate(run?: RunOptions): boolean {
  if (run?.json) return false;
  return process.stdin.isTTY && process.stdout.isTTY && !shouldSkipInteractivePrompts();
}

export async function promptLanguageCodeOnly(run?: RunOptions): Promise<string> {
  logger.decorative.dim('  Target BCP47 code (e.g. ja, pt-br).', run);
  return input({ message: 'Language code', validate: (v) => (v.trim() ? true : 'Required') });
}

/** Interactive **`fill`**: one locale or **`all`** target locales (non-source `*.json` under **`localesDir`**). */
export async function promptFillLanguageSelection(
  localesDir: string,
  sourceBase: string,
  run?: RunOptions,
): Promise<string> {
  const codes = listOtherLocaleCodes(localesDir, sourceBase);
  logger.decorative.dim('  Choose one target locale or all non-source locales.', run);
  if (codes.length === 0) {
    throw new I18nPruneError('No target locale JSON files found under localesDir.', 'USAGE');
  }
  return select({
    message: 'Target locale(s)',
    choices: [
      { name: `All target locales (${String(codes.length)})`, value: ALL_LANG_TOKEN },
      ...codes.map((c) => ({ name: c, value: c })),
    ],
  });
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

export function listOtherLocaleCodes(localesDir: string, sourceBase: string): string[] {
  if (!fs.existsSync(localesDir)) return [];
  return fs
    .readdirSync(localesDir)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.meta.json'))
    .map((f) => path.basename(f, '.json'))
    .filter((c) => c !== sourceBase);
}
