import fs from 'node:fs';
import pathMod from 'node:path';
import { confirm } from '@inquirer/prompts';
import { resolveContext } from '@/core/context/index.js';
import { getCliYesFlag } from '@/core/context/globals.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { resolveLocalesTargetCodes } from '@/core/locales/targets.js';
import { canAsk } from '@/core/ask/index.js';
import { fileExists } from '@/utils/fs/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative, canPrintInfo } from '@/utils/logger/policy.js';
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
import { formatSectionTitle } from '@/utils/style/section.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { LocalesDeleteJsonPayload } from '@/types/command/locales/json.js';
import type { LocalesDeleteOptions } from '@/types/commands/locales/index.js';

export async function localesDelete(opts: LocalesDeleteOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
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
      if (!fileExists(row.jsonPath)) {
        throw new I18nPruneError(`locales delete: file not found: ${row.jsonPath}`, 'USAGE');
      }
    }
    if (canAsk(ctx.run) && !getCliYesFlag()) {
      const ok = await confirm({
        message: `Delete ${targets.length} locale(s): ${targets.join(', ')}?`,
        default: false,
      });
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
          if (canPrintInfo(ctx.run)) logger.info('locales delete: aborted.', ctx.run);
          printCommandSummary(
            {
              command: 'locales delete',
              ok: true,
              durationMs: Date.now() - started,
              notes: ['aborted: user declined confirmation'],
              issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
            },
            ctx,
          );
        }
        pushReportEntry({
          command: 'locales delete',
          level: 'info',
          message: 'locales delete aborted by user',
          data: { targets },
        });
        await finalizeReportFile(ctx.config, {
          command: 'locales delete',
          durationMs: Date.now() - started,
          counts: { deletedJson: 0, deletedMeta: 0 },
        });
        return;
      }
      if (opts.ask) {
        const secondOk = await confirm({
          message: `locales delete: extra confirmation enabled --ask. Delete ${targets.length} locale(s) now?`,
          default: false,
        });
        if (!secondOk) {
          if (canPrintInfo(ctx.run)) logger.info('locales delete: aborted by --ask confirmation.', ctx.run);
          printCommandSummary(
            {
              command: 'locales delete',
              ok: true,
              durationMs: Date.now() - started,
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
      row.hadMeta = fileExists(row.metaPath);
      fs.unlinkSync(row.jsonPath);
      deletedJson += 1;
      if (row.hadMeta) {
        fs.unlinkSync(row.metaPath);
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
          durationMs: Date.now() - started,
          counts: { deletedJson, deletedMeta },
          issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
        },
        ctx,
      );
    }
    pushReportEntry({
      command: 'locales delete',
      level: 'info',
      message: 'locale file deleted',
      data: { targets, deletedMeta, supportsAutoPatching: false },
    });
    await finalizeReportFile(ctx.config, {
      command: 'locales delete',
      durationMs: Date.now() - started,
      counts: { deletedJson, deletedMeta },
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
          ? buildCliJsonEnvelope('locales-delete', emptyPayload, {
              ok: false,
              issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), usageIssues),
              cwd: process.cwd(),
            })
          : buildIoReadFailureEnvelope('locales-delete', emptyPayload, ctx, err);
      console.log(stringifyEnvelope(envelope));
      process.exitCode = 1;
      await finalizeReportFile(ctx.config, {
        command: 'locales delete',
        ok: false,
        durationMs: Date.now() - started,
        counts: {},
      });
      return;
    }
    if (usageIssues.length > 0) {
      printCommandSummary(
        {
          command: 'locales delete',
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
