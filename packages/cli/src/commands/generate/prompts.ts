import { input, confirm, select } from '@inquirer/prompts';
import type { CoreContext, IncompleteRunInfo } from '@i18nprune/core';
import { I18nPruneError, targetLocaleCodesFromContext, segmentsForLocaleCode } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import { ALL_LANG_TOKEN } from '@/utils/cli/args.js';
import { formatLocaleSegmentFilesLabel } from '@/shared/locales/segmentLabel.js';
import { logger } from '@/utils/logger/index.js';
import { duringPrompt } from '@/utils/timer/index.js';

export async function promptLanguageCodeOnly(run?: RunOptions): Promise<string> {
  logger.decorative.dim('  Target BCP47 code (e.g. ja, pt-br).', run);
  return duringPrompt(() =>
    input({ message: 'Language code', validate: (v) => (v.trim() ? true : 'Required') }),
  );
}

export async function promptFullRetranslate(): Promise<boolean> {
  return duringPrompt(() =>
    confirm({
      message: 'Target already complete. Re-translate all string leaves?',
      default: false,
    }),
  );
}

/** Partial target locale: missing segment files and/or keys vs source. */
export async function promptPartialTargetGenerate(input: {
  target: string;
  missingSegmentPaths: string[];
  missingKeyPaths: string[];
}): Promise<'skip' | 'fill_missing' | 'retranslate_all'> {
  const parts: string[] = [];
  if (input.missingSegmentPaths.length > 0) {
    parts.push(`${String(input.missingSegmentPaths.length)} missing segment file(s)`);
  }
  if (input.missingKeyPaths.length > 0) {
    parts.push(`${String(input.missingKeyPaths.length)} missing key(s)`);
  }
  const detail = parts.length > 0 ? parts.join(' · ') : 'incomplete vs source locale';
  return duringPrompt(() =>
    select({
      message: `Target "${input.target}" is partially translated (${detail}). What next?`,
      choices: [
        { name: 'Skip this target', value: 'skip' as const },
        {
          name: 'Translate missing keys and segment files only',
          value: 'fill_missing' as const,
        },
        { name: 'Re-translate all string leaves', value: 'retranslate_all' as const },
      ],
      default: 'fill_missing' as const,
    }),
  );
}

/** Step 10 (`translate-policy (shipped)` §13): confirm writing a partial locale after the provider chain stops. */
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

function resumeLocaleChoiceLabel(coreCtx: CoreContext, code: string): string {
  const segments = segmentsForLocaleCode(coreCtx, code);
  return formatLocaleSegmentFilesLabel(
    code,
    segments.map((s) => s.relativePath),
  );
}

/** Interactive **`generate --resume`**: pick one locale or **`all`**. */
export async function promptGenerateResumeLanguageSelection(
  coreCtx: CoreContext,
  run?: RunOptions,
): Promise<string> {
  const codes = targetLocaleCodesFromContext(coreCtx);
  logger.decorative.dim('  Choose one target locale or all non-source locales (resume).', run);
  if (codes.length === 0) {
    throw new I18nPruneError('No target locale JSON files found in localesDir.', 'USAGE');
  }
  return duringPrompt(() =>
    select({
      message: 'Target locale(s) to resume',
      choices: [
        { name: `All target locales (${String(codes.length)})`, value: ALL_LANG_TOKEN },
        ...codes.map((c) => ({ name: resumeLocaleChoiceLabel(coreCtx, c), value: c })),
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
