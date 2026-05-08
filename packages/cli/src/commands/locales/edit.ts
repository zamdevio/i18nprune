import { input, select } from '@inquirer/prompts';
import { resolveContext } from '@/shared/context/index.js';
import { canAsk } from '@/shared/ask/index.js';
import { I18nPruneError } from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import {
  isLocaleTargetMissingMessage,
  issuesFromDiscoveryWarnings,
  issuesFromLocaleTargetMissing,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import {
  formatLocaleSlugHint,
  listLocaleJsonSlugs,
  resolveCanonicalSlug,
} from '@/commands/locales/localeFiles.js';
import { resolveLocaleMetaProfile } from '@i18nprune/core';
import { assertHostDirectory, writeHostJson } from '@/shared/io/hostJson.js';
import {
  buildSourceLocaleTruthLabel,
  excludeSourceLocaleSlugs,
  getDisplaySourceLocaleCode,
  isSourceLocaleSlug,
} from '@/shared/locales/source.js';
import { logger } from '@/utils/logger/index.js';
import type { LocalesEditJsonPayload } from '@/types/command/locales/json.js';
import type { LocalesEditOptions } from '@/types/commands/locales/index.js';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';

/** Edit **existing** locale JSON and (when implemented) the app’s i18n loader wiring. */
export async function localesEdit(opts: LocalesEditOptions = {}): Promise<void> {
  const wall = attachWallTimer();
  const ctx = await resolveContext();
  const emptyPayload: LocalesEditJsonPayload = {
    kind: 'locales-edit',
    target: null,
    mode: 'meta_updated',
    profileSource: 'catalog',
    before: null,
    after: null,
    metaPath: null,
    supportsAutoPatching: false,
  };
  try {
    const absDir = ctx.paths.localesDir;
    assertHostDirectory(absDir, ctx.adapters.fs);
    const slugs = listLocaleJsonSlugs(absDir, ctx.adapters.fs);
    if (slugs.length === 0) {
      throw new I18nPruneError(`No locale *.json files in ${absDir}`, 'USAGE');
    }
    const sourcePath = ctx.paths.sourceLocale;
    const slugsTargets = excludeSourceLocaleSlugs(slugs, sourcePath, ctx);
    if (slugsTargets.length === 0) {
      throw new I18nPruneError(
        `No target locale JSON files in ${absDir} (only the source locale is present).`,
        'USAGE',
      );
    }

    let target = opts.target?.trim();
    if (target) {
      const canon = resolveCanonicalSlug(target, slugs);
      if (canon && isSourceLocaleSlug(canon, sourcePath, ctx)) {
        throw new I18nPruneError(
          `locales edit does not apply to the source locale ${buildSourceLocaleTruthLabel(getDisplaySourceLocaleCode(ctx))}.`,
          'USAGE',
        );
      }
      if (!canon) {
        throw new I18nPruneError(
          `No locale file for "${target}" — expected one of: ${formatLocaleSlugHint(slugs, sourcePath, ctx.adapters.path)}`,
          'USAGE',
        );
      }
      target = canon;
    } else if (!canAsk(ctx.run)) {
      throw new I18nPruneError(
        `Missing --target (non-interactive). Choose one of: ${formatLocaleSlugHint(slugs, sourcePath, ctx.adapters.path)}`,
        'USAGE',
      );
    } else {
      target = await duringPrompt(() =>
        select({
          message: 'Which existing locale file should we work with?',
          choices: slugsTargets.map((s) => ({ name: `${s}.json`, value: s })),
        }),
      );
    }

    if (target == null || target === '') {
      throw new I18nPruneError('locales edit: missing target locale', 'USAGE');
    }

    const profile = resolveLocaleMetaProfile(
      { fs: ctx.adapters.fs, path: ctx.adapters.path },
      absDir,
      target,
    );
    const before = {
      englishName: profile.englishName,
      nativeName: profile.nativeName,
      direction: profile.direction,
    };
    let englishName = opts.englishName?.trim() || before.englishName;
    let nativeName = opts.nativeName?.trim() || before.nativeName;
    let direction: 'ltr' | 'rtl' = opts.direction ?? before.direction;

    if (canAsk(ctx.run)) {
      if (!opts.englishName) {
        englishName = (
          await duringPrompt(() =>
            input({
              message: `${target}.meta.json englishName`,
              default: englishName,
            }),
          )
        ).trim();
      }
      if (!opts.nativeName) {
        nativeName = (
          await duringPrompt(() =>
            input({
              message: `${target}.meta.json nativeName`,
              default: nativeName,
            }),
          )
        ).trim();
      }
      if (!opts.direction) {
        direction = await duringPrompt(() =>
          select({
            message: `${target}.meta.json direction`,
            choices: [
              { name: 'ltr', value: 'ltr' },
              { name: 'rtl', value: 'rtl' },
            ],
            default: direction,
          }),
        );
      }
    }
    writeHostJson(
      profile.metaPath,
      {
        lang: target,
        englishName,
        nativeName,
        direction,
      },
      ctx.adapters.fs,
    );

    const payload: LocalesEditJsonPayload = {
      kind: 'locales-edit',
      target,
      mode: 'meta_updated',
      profileSource: profile.source,
      before,
      after: { englishName, nativeName, direction },
      metaPath: profile.metaPath,
      supportsAutoPatching: false,
    };

    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('locales-edit', payload, {
            ok: true,
            issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
            cwd: process.cwd(),
          }),
        ),
      );
    } else {
      logger.info(`updated ${profile.metaPath} (englishName/nativeName/direction).`, ctx.run);
      printCommandSummary(
        {
          command: 'locales edit',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: { target: 1, metaUpdated: 1 },
          issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
        },
        ctx,
      );
    }
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    const localeMissingIssues = isLocaleTargetMissingMessage(errMessage)
      ? issuesFromLocaleTargetMissing(errMessage)
      : [];
    const usageIssues =
      localeMissingIssues.length > 0
        ? localeMissingIssues
        : err instanceof I18nPruneError && err.code === 'USAGE'
          ? issuesFromLocalesUsage(errMessage)
          : [];
    if (ctx.run.json) {
      const envelope =
        usageIssues.length > 0
          ? buildCliJsonEnvelope('locales-edit', emptyPayload, {
              ok: false,
              issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), usageIssues),
              cwd: process.cwd(),
            })
          : buildIoReadFailureEnvelope('locales-edit', emptyPayload, ctx, err);
      console.log(stringifyEnvelope(envelope));
      process.exitCode = 1;
      return;
    }
    if (usageIssues.length > 0) {
      printCommandSummary(
        {
          command: 'locales edit',
          ok: false,
          durationMs: wall.elapsedMs(),
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), usageIssues),
        },
        ctx,
      );
      process.exitCode = 1;
      return;
    }
    throw err;
  } finally {
    wall.dispose();
  }
}
