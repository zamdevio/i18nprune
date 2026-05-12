import path from 'node:path';
import { assertHostDirectory, listHostJsonBasenames } from '@/shared/io/hostJson.js';
import { resolveContext } from '@/shared/context/index.js';
import { I18nPruneError } from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@i18nprune/core';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { buildLocaleListRows } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import type { LocalesListJsonPayload } from '@/types/command/locales/json.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { attachWallTimer } from '@/utils/timer/index.js';

function emptyListPayload(localesDir: string, sourceLocalePath: string): LocalesListJsonPayload {
  const sourceLocaleCode = path.basename(sourceLocalePath, '.json');
  return {
    kind: 'locales-list',
    sourceLocaleCode,
    sourceLocalePath,
    localesDir,
    localeCount: 0,
    targetLocaleCount: 0,
    rows: [],
  };
}

function resolveLocalesListData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
): LocalesListJsonPayload {
  const { localesDir, sourceLocale } = ctx.paths;
  assertHostDirectory(localesDir, ctx.adapters.fs);
  const files = listHostJsonBasenames(localesDir, ctx.adapters.fs).sort((a, b) => a.localeCompare(b));
  const rows = buildLocaleListRows(
    { fs: ctx.adapters.fs, path: ctx.adapters.path },
    localesDir,
    files,
    sourceLocale,
  );
  return {
    kind: 'locales-list',
    sourceLocaleCode: path.basename(sourceLocale, '.json'),
    sourceLocalePath: sourceLocale,
    localesDir,
    localeCount: rows.length,
    targetLocaleCount: rows.filter((row) => !row.isSourceLocale).length,
    rows,
  };
}

export async function localesList(): Promise<void> {
  const wall = attachWallTimer();
  const ctx = await resolveContext();
  const { localesDir, sourceLocale } = ctx.paths;
  try {
    const payload = resolveLocalesListData(ctx);

    if (ctx.run.json) {
      const envelope = buildCliJsonEnvelope('locales-list', payload, {
        ok: true,
        issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
        cwd: process.cwd(),
      });
      console.log(stringifyEnvelope(envelope));
    } else {
      const window = resolveCliListWindow(ctx.config, { defaultFull: true });
      const shownRows = payload.rows.slice(0, window.limit);
      if (canPrintInfo(ctx.run)) {
        logger.info(`${String(payload.localeCount)} locale file(s) in ${localesDir}`, ctx.run);
        for (const row of shownRows) {
          const extras =
            row.englishIdenticalLeafCount === null
              ? 'source locale'
              : `source-identical: ${String(row.englishIdenticalLeafCount)}`;
          logger.detail(`  ${row.code}.json · leaves ${String(row.leafCount)} · ${extras}`, ctx.run);
        }
        if (payload.rows.length > shownRows.length) {
          logger.detail(`  ... ${String(payload.rows.length - shownRows.length)} more locale(s) hidden`, ctx.run);
        }
      }
      printCommandSummary(
        {
          command: 'locales list',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: {
            locales: payload.localeCount,
            targets: payload.targetLocaleCount,
          },
          issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
        },
        ctx,
      );
    }
  } catch (err) {
    if (ctx.run.json) {
      const usageIssues =
        err instanceof I18nPruneError && err.code === 'USAGE' ? issuesFromLocalesUsage(err.message) : [];
      const envelope =
        usageIssues.length > 0
          ? buildCliJsonEnvelope('locales-list', emptyListPayload(localesDir, sourceLocale), {
              ok: false,
              issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), usageIssues),
              cwd: process.cwd(),
            })
          : buildIoReadFailureEnvelope('locales-list', emptyListPayload(localesDir, sourceLocale), ctx, err);
      console.log(stringifyEnvelope(envelope));
      process.exitCode = 1;
      return;
    }
    throw err;
  } finally {
    wall.dispose();
  }
}
