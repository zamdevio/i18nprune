import fs from 'node:fs';
import { select } from '@inquirer/prompts';
import { resolveContext } from '@/core/context/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import {
  formatLocaleSlugHint,
  listLocaleJsonSlugs,
  resolveCanonicalSlug,
} from '@/commands/locales/localeFiles.js';
import {
  buildSourceLocaleTruthLabel,
  excludeSourceLocaleSlugs,
  getDisplaySourceLocaleCode,
  isSourceLocaleSlug,
} from '@/core/locales/source.js';
import { logger } from '@/utils/logger/index.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';

export type LocalesEditOptions = {
  lang?: string;
};

/** Edit **existing** locale JSON and (when implemented) the app’s i18n loader wiring. */
export async function runLocalesEdit(opts: LocalesEditOptions = {}): Promise<void> {
  const ctx = resolveContext();
  const absDir = ctx.paths.localesDir;
  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
    throw new I18nPruneError(`localesDir is not a directory: ${absDir}`, 'USAGE');
  }
  const slugs = listLocaleJsonSlugs(absDir);
  if (slugs.length === 0) {
    throw new I18nPruneError(`No locale *.json files in ${absDir}`, 'USAGE');
  }
  const sourcePath = ctx.paths.sourceLocale;
  const slugsTargets = excludeSourceLocaleSlugs(slugs, sourcePath);
  if (slugsTargets.length === 0) {
    throw new I18nPruneError(
      `No target locale JSON files in ${absDir} (only the source locale is present).`,
      'USAGE',
    );
  }

  let lang = opts.lang?.trim();
  if (lang) {
    const canon = resolveCanonicalSlug(lang, slugs);
    if (canon && isSourceLocaleSlug(canon, sourcePath)) {
      throw new I18nPruneError(
        `locales edit does not apply to the source locale ${buildSourceLocaleTruthLabel(getDisplaySourceLocaleCode(ctx))}.`,
        'USAGE',
      );
    }
    if (!canon) {
      throw new I18nPruneError(
        `No locale file for "${lang}" — expected one of: ${formatLocaleSlugHint(slugs, sourcePath)}`,
        'USAGE',
      );
    }
    lang = canon;
  } else if (shouldSkipInteractivePrompts()) {
    throw new I18nPruneError(
      `Missing --lang (non-interactive). Choose one of: ${formatLocaleSlugHint(slugs, sourcePath)}`,
      'USAGE',
    );
  } else {
    lang = await select({
      message: 'Which existing locale file should we work with?',
      choices: slugsTargets.map((s) => ({ name: `${s}.json`, value: s })),
    });
  }

  logger.info(
    `locales edit — planned: ${lang}.json under localesDir and your app’s i18n loader (supported patterns / auto-patch TBD).`,
    ctx.run,
  );
}
