import { select } from '@inquirer/prompts';
import { I18nPruneError } from '@/core/errors/index.js';
import { parseLocaleCodesList, isAllLangToken, pickTargetSelector } from '@/utils/cli/args.js';
import { canAsk } from '@/core/ask/index.js';
import { normalizeLanguageCode } from '@/core/languages/index.js';
import { assertNotSourceTargetLocale } from '@/core/locales/source.js';
import { listLocaleJsonSlugs } from '@/commands/locales/localeFiles.js';
import { excludeSourceLocaleSlugs } from '@/core/locales/source.js';
import type { Context } from '@/types/core/context/index.js';

export async function resolveLocalesTargetCodes(
  ctx: Context,
  commandName: string,
  rawTarget: string | undefined,
  opts?: { promptWhenMissing?: boolean },
): Promise<string[]> {
  const allSlugs = listLocaleJsonSlugs(ctx.paths.localesDir);
  const targetSlugs = excludeSourceLocaleSlugs(allSlugs, ctx.paths.sourceLocale);
  if (targetSlugs.length === 0) {
    throw new I18nPruneError(`${commandName}: no target locale files found in localesDir`, 'USAGE');
  }
  const selected = pickTargetSelector(rawTarget);
  if (!selected) {
    if (!opts?.promptWhenMissing || !canAsk(ctx.run)) {
      throw new I18nPruneError(`${commandName} requires --target <code[,code]|all>`, 'USAGE');
    }
    const picked = await select({
      message: `Select locale for ${commandName}:`,
      choices: targetSlugs.map((code) => ({ name: `${code}.json`, value: code })),
    });
    return [picked];
  }
  if (isAllLangToken(selected)) {
    return targetSlugs.map((x) => normalizeLanguageCode(x));
  }
  const parsed = parseLocaleCodesList(selected);
  for (const code of parsed) {
    assertNotSourceTargetLocale(commandName, code, ctx.paths.sourceLocale, ctx);
    if (!targetSlugs.some((x) => normalizeLanguageCode(x) === code)) {
      throw new I18nPruneError(`${commandName}: locale file not found for target "${code}"`, 'USAGE');
    }
  }
  return parsed;
}
