import { select } from '@inquirer/prompts';
import { I18nPruneError } from '@i18nprune/core';
import { canAsk } from '@/shared/ask/index.js';
import { listLocaleJsonSlugs } from '@/commands/locales/localeFiles.js';
import type { Context } from '@/types/core/context/index.js';
import {
  pickTargetSelector,
  resolveLocaleTargetCodes as resolveLocaleTargetCodesFromCore,
  resolveTargetLocaleSlugs,
} from '@i18nprune/core';
import { duringPrompt } from '@/utils/timer/index.js';

export async function resolveLocalesTargetCodes(
  ctx: Context,
  commandName: string,
  rawTarget: string | undefined,
  opts?: { promptWhenMissing?: boolean },
): Promise<string[]> {
  const allSlugs = listLocaleJsonSlugs(ctx.paths.localesDir, ctx.adapters.fs);
  const targetSlugs = resolveTargetLocaleSlugs(ctx.adapters.path, allSlugs, ctx.paths.sourceLocale);
  if (targetSlugs.length === 0) {
    throw new I18nPruneError(`${commandName}: no target locale files found in localesDir`, 'USAGE');
  }
  const selected = pickTargetSelector(rawTarget);
  if (!selected) {
    if (!opts?.promptWhenMissing || !canAsk(ctx.run)) {
      throw new I18nPruneError(`${commandName} requires --target <code[,code]|all>`, 'USAGE');
    }
    const picked = await duringPrompt(() =>
      select({
        message: `Select locale for ${commandName}:`,
        choices: targetSlugs.map((code) => ({ name: `${code}.json`, value: code })),
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
