import { select } from '@inquirer/prompts';
import {
  I18nPruneError,
  localeCodesFromContext,
  segmentsForLocaleCode,
  targetLocaleCodesFromContext,
} from '@i18nprune/core';
import { canAsk } from '@/shared/ask/index.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import type { Context } from '@/types/core/context/index.js';
import {
  pickTargetSelector,
  resolveLocaleTargetCodes as resolveLocaleTargetCodesFromCore,
} from '@i18nprune/core';
import { formatLocaleSegmentFilesLabel } from '@/shared/locales/segmentLabel.js';
import { duringPrompt } from '@/utils/timer/index.js';

function localeChoiceLabel(
  coreCtx: ReturnType<typeof createCliCoreContext>,
  code: string,
): string {
  const segments = segmentsForLocaleCode(coreCtx, code);
  return formatLocaleSegmentFilesLabel(
    code,
    segments.map((s) => s.relativePath),
  );
}

export async function resolveLocalesTargetCodes(
  ctx: Context,
  commandName: string,
  rawTarget: string | undefined,
  opts?: { promptWhenMissing?: boolean },
): Promise<string[]> {
  const coreCtx = createCliCoreContext(ctx);
  const allSlugs = localeCodesFromContext(coreCtx);
  const targetSlugs = targetLocaleCodesFromContext(coreCtx);
  if (targetSlugs.length === 0) {
    throw new I18nPruneError(`${commandName}: no target locale files found in localesDir`, 'USAGE');
  }
  const selected = pickTargetSelector(rawTarget);
  if (!selected) {
    if (!opts?.promptWhenMissing || !canAsk(ctx.run)) {
      throw new I18nPruneError(`${commandName} requires --target <code[,code]|all>`, 'USAGE');
    }
    const picked = await duringPrompt(() =>
      select<string>({
        message: `Select locale for ${commandName}:`,
        choices: targetSlugs.map((code) => ({ name: localeChoiceLabel(coreCtx, code), value: code })),
      }),
    );
    return [picked];
  }
  return resolveLocaleTargetCodesFromCore({
    commandName,
    rawTarget: selected,
    localeSlugs: allSlugs,
    sourceLocalePath: ctx.paths.sourceLocale,
    path: ctx.adapters.path,
  });
}
