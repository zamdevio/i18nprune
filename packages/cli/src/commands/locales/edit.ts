import fs from 'node:fs';
import { input, select } from '@inquirer/prompts';
import { resolveContext } from '@/core/context/index.js';
import { canAsk } from '@/core/ask/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@/core/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import {
  isLocaleTargetMissingMessage,
  issuesFromDiscoveryWarnings,
  issuesFromLocaleTargetMissing,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import {
  formatLocaleSlugHint,
  listLocaleJsonSlugs,
  resolveCanonicalSlug,
} from '@/commands/locales/localeFiles.js';
import { resolveLocaleMetaProfile } from '@/core/locales/metaProfile.js';
import { writeJsonFile } from '@/utils/fs/index.js';
import {
  buildSourceLocaleTruthLabel,
  excludeSourceLocaleSlugs,
  getDisplaySourceLocaleCode,
  isSourceLocaleSlug,
} from '@/core/locales/source.js';
import { logger } from '@/utils/logger/index.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { LocalesEditJsonPayload } from '@/types/command/locales/json.js';
import type { LocalesEditOptions } from '@/types/commands/locales/index.js';

/** Edit **existing** locale JSON and (when implemented) the app’s i18n loader wiring. */
export async function localesEdit(opts: LocalesEditOptions = {}): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
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

    let target = opts.target?.trim();
    if (target) {
      const canon = resolveCanonicalSlug(target, slugs);
      if (canon && isSourceLocaleSlug(canon, sourcePath)) {
        throw new I18nPruneError(
          `locales edit does not apply to the source locale ${buildSourceLocaleTruthLabel(getDisplaySourceLocaleCode(ctx))}.`,
          'USAGE',
        );
      }
      if (!canon) {
        throw new I18nPruneError(
          `No locale file for "${target}" — expected one of: ${formatLocaleSlugHint(slugs, sourcePath)}`,
          'USAGE',
        );
      }
      target = canon;
    } else if (!canAsk(ctx.run)) {
      throw new I18nPruneError(
        `Missing --target (non-interactive). Choose one of: ${formatLocaleSlugHint(slugs, sourcePath)}`,
        'USAGE',
      );
    } else {
      target = await select({
        message: 'Which existing locale file should we work with?',
        choices: slugsTargets.map((s) => ({ name: `${s}.json`, value: s })),
      });
    }

    const profile = resolveLocaleMetaProfile(absDir, target);
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
        englishName = (await input({
          message: `${target}.meta.json englishName`,
          default: englishName,
        })).trim();
      }
      if (!opts.nativeName) {
        nativeName = (await input({
          message: `${target}.meta.json nativeName`,
          default: nativeName,
        })).trim();
      }
      if (!opts.direction) {
        direction = await select({
          message: `${target}.meta.json direction`,
          choices: [
            { name: 'ltr', value: 'ltr' },
            { name: 'rtl', value: 'rtl' },
          ],
          default: direction,
        });
      }
    }
    writeJsonFile(profile.metaPath, {
      lang: target,
      englishName,
      nativeName,
      direction,
    });

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
      logger.info(
        `locales edit: updated ${profile.metaPath} (englishName/nativeName/direction).`,
        ctx.run,
      );
      printCommandSummary(
        {
          command: 'locales edit',
          ok: true,
          durationMs: Date.now() - started,
          counts: { target: 1, metaUpdated: 1 },
          issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
        },
        ctx,
      );
    }
    pushReportEntry({
      command: 'locales edit',
      level: 'info',
      message: 'locale meta updated',
      data: { target, metaPath: profile.metaPath, profileSource: profile.source, supportsAutoPatching: false },
    });
    await finalizeReportFile(ctx.config, {
      command: 'locales edit',
      durationMs: Date.now() - started,
      counts: { target: 1, metaUpdated: 1 },
    });
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
      await finalizeReportFile(ctx.config, {
        command: 'locales edit',
        ok: false,
        durationMs: Date.now() - started,
        counts: {},
      });
      return;
    }
    if (usageIssues.length > 0) {
      printCommandSummary(
        {
          command: 'locales edit',
          ok: false,
          durationMs: Date.now() - started,
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), usageIssues),
        },
        ctx,
      );
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}
