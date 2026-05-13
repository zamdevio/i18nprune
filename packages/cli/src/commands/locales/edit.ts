import { input, select } from '@inquirer/prompts';
import { resolveContext } from '@/shared/context/index.js';
import { canAsk } from '@/shared/ask/index.js';
import { I18nPruneError, type PatchingLocaleRecord } from '@i18nprune/core';
import { resolveLocaleEditProfile, writeLocaleMetaEdit } from '@i18nprune/core';
import type { EditTargetFields } from '@i18nprune/core';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { printCommandSummary } from '@/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@i18nprune/core';
import { buildIoReadFailureEnvelope } from '@/shared/result/index.js';
import {
  isLocaleTargetMissingMessage,
  issuesFromDiscoveryWarnings,
  issuesFromLocaleTargetMissing,
  issuesFromLocaleTargetsSkipped,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/shared/result/index.js';
import {
  formatLocaleSlugHintPlain,
  listLocaleJsonSlugs,
  resolveCanonicalSlug,
} from '@/commands/locales/localeFiles.js';
import { assertHostDirectory } from '@/shared/io/hostJson.js';
import {
  excludeSourceLocaleSlugs,
  isSourceLocaleSlug,
} from '@/shared/locales/index.js';
import { logger } from '@/utils/logger/index.js';
import type { LocalesEditJsonPayload } from '@/types/command/locales/json.js';
import type { LocalesEditOptions } from '@/types/commands/locales/index.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';

type ResolvedEditTargets = {
  targets: string[];
  skippedTargets: string[];
};

function parseRequestedTargets(rawTarget: string): string[] {
  return rawTarget
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

async function resolveLocalesEditTargets(inp: {
  opts: LocalesEditOptions;
  slugs: string[];
  targetSlugs: string[];
  sourcePath: string;
  ctx: Awaited<ReturnType<typeof resolveContext>>;
}): Promise<ResolvedEditTargets> {
  const { opts, slugs, targetSlugs, sourcePath, ctx } = inp;
  const rawTarget = opts.target?.trim();
  if (!rawTarget) {
    if (getCliYesFlag() || !canAsk(ctx.run)) {
      throw new I18nPruneError(
        `locales edit requires --target <code[,code]|all> in non-interactive mode. Choose one of: ${formatLocaleSlugHintPlain(slugs, sourcePath, ctx.adapters.path)}`,
        'USAGE',
      );
    }
    const picked = await duringPrompt(() =>
      select({
        message: 'Which existing locale file should we work with?',
        choices: targetSlugs.map((s) => ({ name: `${s}.json`, value: s })),
      }),
    );
    return { targets: [picked], skippedTargets: [] };
  }

  if (rawTarget.toLowerCase() === 'all') {
    return { targets: targetSlugs, skippedTargets: [] };
  }

  const targets: string[] = [];
  const skippedTargets: string[] = [];
  for (const requested of parseRequestedTargets(rawTarget)) {
    const canon = resolveCanonicalSlug(requested, slugs);
    if (!canon || isSourceLocaleSlug(canon, sourcePath, ctx)) {
      skippedTargets.push(requested);
      continue;
    }
    if (!targets.includes(canon)) targets.push(canon);
  }

  if (targets.length === 0) {
    throw new I18nPruneError(
      `No editable target locale file(s) found for "${rawTarget}" — expected one of: ${formatLocaleSlugHintPlain(slugs, sourcePath, ctx.adapters.path)}`,
      'USAGE',
    );
  }
  return { targets, skippedTargets };
}

/** Edit existing locale metadata and, with `--patch`, supported app i18n loader wiring. */
export async function localesEdit(opts: LocalesEditOptions = {}): Promise<void> {
  const wall = attachWallTimer();
  const ctx = await resolveContext();
  const emptyPayload: LocalesEditJsonPayload = {
    kind: 'locales-edit',
    target: null,
    targets: [],
    skippedTargets: [],
    updated: 0,
    mode: 'meta_updated',
    profileSource: 'catalog',
    before: null,
    after: null,
    metaPath: null,
    rows: [],
    supportsAutoPatching: true,
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

    const rawDirection = opts.directionRaw ?? opts.direction;
    if (rawDirection !== undefined && rawDirection !== 'ltr' && rawDirection !== 'rtl') {
      throw new I18nPruneError('locales edit: --direction must be "ltr" or "rtl"', 'USAGE');
    }
    const { targets, skippedTargets } = await resolveLocalesEditTargets({
      opts,
      slugs,
      targetSlugs: slugsTargets,
      sourcePath,
      ctx,
    });
    const promptForFields = canAsk(ctx.run) && !getCliYesFlag();
    const coreCtx = createCliCoreContext(ctx);
    const edits: EditTargetFields[] = [];
    const upsertLocaleRecords: PatchingLocaleRecord[] = [];

    for (const target of targets) {
      const profile = resolveLocaleEditProfile(coreCtx, target);
      let englishName = opts.englishName?.trim() || profile.englishName;
      let nativeName = opts.nativeName?.trim() || profile.nativeName;
      let direction: 'ltr' | 'rtl' = rawDirection as 'ltr' | 'rtl' ?? profile.direction;

      if (promptForFields) {
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
        if (!rawDirection) {
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

      edits.push({ target, englishName, nativeName, direction });
      upsertLocaleRecords.push({ code: target, englishName, nativeName, direction });
    }

    const { payload } = writeLocaleMetaEdit(coreCtx, edits, skippedTargets);

    await applyCommandPatching({
      ctx,
      command: 'locales-edit',
      action: 'upsert_locales',
      localeCodes: targets,
      upsertLocaleRecords,
    });

    const skippedIssues =
      skippedTargets.length > 0
        ? issuesFromLocaleTargetsSkipped(
            `Skipped target locale(s) without editable locale JSON files: ${skippedTargets.join(', ')}`,
          )
        : [];
    const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), skippedIssues);

    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('locales-edit', payload, {
            ok: true,
            issues,
            cwd: process.cwd(),
          }),
        ),
      );
    } else {
      for (const row of payload.rows) {
        logger.info(`updated ${row.metaPath} (englishName/nativeName/direction).`, ctx.run);
      }
      printCommandSummary(
        {
          command: 'locales edit',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: { targets: targets.length, metaUpdated: payload.rows.length, skippedTargets: skippedTargets.length },
          issues,
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
