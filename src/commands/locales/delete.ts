import fs from 'node:fs';
import pathMod from 'node:path';
import { confirm } from '@inquirer/prompts';
import { resolveContext } from '@/core/context/index.js';
import { getCliYesFlag } from '@/core/context/globals.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { assertNotSourceTargetLocale } from '@/core/locales/source.js';
import { normalizeLanguageCode } from '@/core/languages/index.js';
import { canPromptGenerate } from '@/commands/generate/prompts.js';
import { fileExists } from '@/utils/fs/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative, canPrintInfo } from '@/utils/logger/policy.js';
import { printCommandSummary } from '@/core/output/index.js';
import { formatSectionTitle } from '@/utils/style/section.js';

export type LocalesDeleteOptions = {
  lang?: string;
};

export async function runLocalesDelete(opts: LocalesDeleteOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  let lang = opts.lang?.trim();
  if (!lang) {
    throw new I18nPruneError('locales delete requires --lang <code>', 'USAGE');
  }
  lang = normalizeLanguageCode(lang);
  assertNotSourceTargetLocale('locales delete', lang, ctx.paths.sourceLocale, ctx);

  const dir = ctx.paths.localesDir;
  const jsonPath = pathMod.join(dir, `${lang}.json`);
  const metaPath = pathMod.join(dir, `${lang}.meta.json`);

  if (!fileExists(jsonPath)) {
    throw new I18nPruneError(`locales delete: file not found: ${jsonPath}`, 'USAGE');
  }

  if (canPromptGenerate(ctx.run) && !getCliYesFlag()) {
    const ok = await confirm({
      message: `Delete ${jsonPath}${fileExists(metaPath) ? ` and ${metaPath}` : ''}?`,
      default: false,
    });
    if (!ok) {
      if (canPrintInfo(ctx.run)) logger.info('locales delete: aborted.', ctx.run);
      printCommandSummary(
        {
          command: 'locales delete',
          ok: true,
          durationMs: Date.now() - started,
          notes: ['aborted: user declined confirmation'],
        },
        ctx,
      );
      return;
    }
  } else if (!canPromptGenerate(ctx.run) && !getCliYesFlag()) {
    throw new I18nPruneError(
      'locales delete: requires global --yes when non-interactive',
      'USAGE',
    );
  }

  const hadMeta = fileExists(metaPath);
  fs.unlinkSync(jsonPath);
  if (hadMeta) fs.unlinkSync(metaPath);

  if (canPrintDecorative(ctx.run)) {
    logger.primary('', ctx.run);
    logger.primary(formatSectionTitle(`Deleted locale · ${lang}`), ctx.run);
  }
  if (canPrintInfo(ctx.run)) {
    logger.info(`Removed ${jsonPath}`, ctx.run);
    if (hadMeta) logger.info(`Removed ${metaPath}`, ctx.run);
  }

  printCommandSummary(
    {
      command: 'locales delete',
      ok: true,
      durationMs: Date.now() - started,
      counts: { deletedJson: 1, deletedMeta: hadMeta ? 1 : 0 },
    },
    ctx,
  );
}
