import { input, confirm, select } from '@inquirer/prompts';
import type { IncompleteRunInfo, ProjectFilesystemRuntime } from '@i18nprune/core';
import { I18nPruneError, listOtherLocaleCodes } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import { ALL_LANG_TOKEN } from '@/utils/cli/args.js';
import { logger } from '@/utils/logger/index.js';
import { duringPrompt } from '@/utils/timer/index.js';

export async function promptLanguageCodeOnly(run?: RunOptions): Promise<string> {
  logger.decorative.dim('  Target BCP47 code (e.g. ja, pt-br).', run);
  return duringPrompt(() =>
    input({ message: 'Language code', validate: (v) => (v.trim() ? true : 'Required') }),
  );
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
  const englishName = await duringPrompt(() =>
    input({
      message: 'English name',
      default: defaults.englishName,
      validate: (v) => (v.trim() ? true : 'Required'),
    }),
  );
  const nativeName = await duringPrompt(() =>
    input({
      message: 'Native name',
      default: defaults.nativeName,
      validate: (v) => (v.trim() ? true : 'Required'),
    }),
  );
  const direction = await duringPrompt(() =>
    select({
      message: 'Direction',
      choices: [
        { value: 'ltr' as const, name: 'ltr — left-to-right' },
        { value: 'rtl' as const, name: 'rtl — right-to-left' },
      ],
      default: defaults.direction,
    }),
  );
  return { englishName, nativeName, direction };
}

export async function promptFullRetranslate(): Promise<boolean> {
  return duringPrompt(() =>
    confirm({
      message: 'Target already complete. Re-translate all string leaves?',
      default: false,
    }),
  );
}

/** Step 10 (`translate-policy.md` §13): confirm writing a partial locale after the provider chain stops. */
export async function promptGenerateIncompleteWrite(
  info: IncompleteRunInfo,
  run?: RunOptions,
): Promise<boolean> {
  const total = info.successfulLeaves + info.failedLeaves;
  logger.decorative.dim(
    `  Translation stopped early for "${info.target}" (${String(info.successfulLeaves)}/${String(total)} leaves succeeded in-session).`,
    run,
  );
  return duringPrompt(() =>
    confirm({
      message:
        'Write partial target now? You can run `i18nprune generate --resume` later to finish untranslated leaves.',
      default: true,
    }),
  );
}

/** Interactive **`generate --resume`**: pick one locale or **`all`**. */
export async function promptGenerateResumeLanguageSelection(
  localesDir: string,
  sourceBase: string,
  runtime: ProjectFilesystemRuntime,
  run?: RunOptions,
): Promise<string> {
  const codes = listOtherLocaleCodes(runtime, localesDir, sourceBase);
  logger.decorative.dim('  Choose one target locale or all non-source locales (resume).', run);
  if (codes.length === 0) {
    throw new I18nPruneError('No target locale JSON files found under localesDir.', 'USAGE');
  }
  return duringPrompt(() =>
    select({
      message: 'Target locale(s) to resume',
      choices: [
        { name: `All target locales (${String(codes.length)})`, value: ALL_LANG_TOKEN },
        ...codes.map((c) => ({ name: c, value: c })),
      ],
    }),
  );
}

export async function confirmGenerateResumeAsk(targets: readonly string[]): Promise<boolean> {
  return duringPrompt(() =>
    confirm({
      message: `Resume translate ${String(targets.length)} locale(s): ${targets.join(', ')}?`,
      default: false,
    }),
  );
}
