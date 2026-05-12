import pathMod from 'node:path';
import { confirm } from '@inquirer/prompts';
import { resolveContext } from '@/shared/context/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { I18nPruneError } from '@i18nprune/core';
import { resolveLocalesTargetCodes } from '@/shared/locales/targets.js';
import { canAsk } from '@/shared/ask/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative, canPrintInfo } from '@/utils/logger/policy.js';
import { printCommandSummary } from '@/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@i18nprune/core';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import {
  isLocaleTargetMissingMessage,
  issuesFromDiscoveryWarnings,
  issuesFromLocaleTargetMissing,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { formatSectionTitle } from '@/utils/style/section.js';
import type { LocalesDeleteJsonPayload } from '@/types/command/locales/json.js';
import type { LocalesDeleteOptions } from '@/types/commands/locales/index.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';

export async function localesDelete(opts: LocalesDeleteOptions): Promise<void> {
  const wall = attachWallTimer();
  const ctx = await resolveContext();
  const emptyPayload: LocalesDeleteJsonPayload = {
    kind: 'locales-delete',
    targets: [],
    deletedJson: 0,
    deletedMeta: 0,
    aborted: false,
    supportsAutoPatching: false,
  };
  try {
    const targets = await resolveLocalesTargetCodes(ctx, 'locales delete', opts.target, {
      promptWhenMissing: true,
    });
    const dir = ctx.paths.localesDir;
    const targetPaths = targets.map((target) => ({
      target,
      jsonPath: pathMod.join(dir, `${target}.json`),
      metaPath: pathMod.join(dir, `${target}.meta.json`),
      hadMeta: false,
    }));
    for (const row of targetPaths) {
      if (!(await Promise.resolve(ctx.adapters.fs.exists(row.jsonPath)))) {
        throw new I18nPruneError(`locales delete: file not found: ${row.jsonPath}`, 'USAGE');
      }
    }
    if (canAsk(ctx.run) && !getCliYesFlag()) {
      const ok = await duringPrompt(() =>
        confirm({
          message: `Delete ${targets.length} locale(s): ${targets.join(', ')}?`,
          default: false,
        }),
      );
      if (!ok) {
        const abortedPayload: LocalesDeleteJsonPayload = {
          kind: 'locales-delete',
          targets,
          deletedJson: 0,
          deletedMeta: 0,
          aborted: true,
          supportsAutoPatching: false,
        };
        if (ctx.run.json) {
          console.log(
            stringifyEnvelope(
              buildCliJsonEnvelope('locales-delete', abortedPayload, {
                ok: true,
                issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
                cwd: process.cwd(),
              }),
            ),
          );
        } else {
          if (canPrintInfo(ctx.run)) logger.info('aborted.', ctx.run);
          printCommandSummary(
            {
              command: 'locales delete',
              ok: true,
              durationMs: wall.elapsedMs(),
              notes: ['aborted: user declined confirmation'],
              issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
            },
            ctx,
          );
        }
        return;
      }
      if (opts.ask) {
        const secondOk = await duringPrompt(() =>
          confirm({
            message: `extra confirmation enabled --ask. Delete ${targets.length} locale(s) now?`,
            default: false,
          }),
        );
        if (!secondOk) {
          if (canPrintInfo(ctx.run)) logger.info('aborted by --ask confirmation.', ctx.run);
          printCommandSummary(
            {
              command: 'locales delete',
              ok: true,
              durationMs: wall.elapsedMs(),
              notes: ['aborted: user declined --ask confirmation'],
              issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
            },
            ctx,
          );
          return;
        }
      }
    } else if (!canAsk(ctx.run) && !getCliYesFlag()) {
      throw new I18nPruneError('locales delete: requires global --yes when non-interactive', 'USAGE');
    }
    let deletedJson = 0;
    let deletedMeta = 0;
    for (const row of targetPaths) {
      row.hadMeta = await Promise.resolve(ctx.adapters.fs.exists(row.metaPath));
      await Promise.resolve(ctx.adapters.fs.deleteFile(row.jsonPath));
      deletedJson += 1;
      if (row.hadMeta) {
        await Promise.resolve(ctx.adapters.fs.deleteFile(row.metaPath));
        deletedMeta += 1;
      }
    }
    const payload: LocalesDeleteJsonPayload = {
      kind: 'locales-delete',
      targets,
      deletedJson,
      deletedMeta,
      aborted: false,
      supportsAutoPatching: false,
    };
    await applyCommandPatching({
      ctx,
      command: 'locales-delete',
      action: 'delete_locales',
      localeCodes: targets,
    });
    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('locales-delete', payload, {
            ok: true,
            issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
            cwd: process.cwd(),
          }),
        ),
      );
    } else {
      if (canPrintDecorative(ctx.run)) {
        logger.primary('', ctx.run);
        logger.primary(formatSectionTitle(`Deleted locale(s) · ${targets.join(', ')}`), ctx.run);
      }
      if (canPrintInfo(ctx.run)) {
        for (const row of targetPaths) {
          logger.info(`Removed ${row.jsonPath}`, ctx.run);
          if (row.hadMeta) logger.info(`Removed ${row.metaPath}`, ctx.run);
        }
      }
      printCommandSummary(
        {
          command: 'locales delete',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: { deletedJson, deletedMeta },
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
          ? buildCliJsonEnvelope('locales-delete', emptyPayload, {
              ok: false,
              issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), usageIssues),
              cwd: process.cwd(),
            })
          : buildIoReadFailureEnvelope('locales-delete', emptyPayload, ctx, err);
      console.log(stringifyEnvelope(envelope));
      process.exitCode = 1;
      return;
    }
    if (usageIssues.length > 0) {
      printCommandSummary(
        {
          command: 'locales delete',
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
