import fs from 'node:fs';
import path from 'node:path';
import { listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { resolveContext } from '@/core/context/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@/core/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import { buildLocaleListRows } from '@/core/locales/summary.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { LocalesListJsonPayload } from '@/types/command/locales/json.js';

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

export async function localesList(): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const { localesDir, sourceLocale } = ctx.paths;
  try {
    if (!fs.existsSync(localesDir) || !fs.statSync(localesDir).isDirectory()) {
      throw new I18nPruneError(`localesDir is not a directory: ${localesDir}`, 'USAGE');
    }
    const files = listJsonBasenamesInDir(localesDir).sort((a, b) => a.localeCompare(b));
    const rows = buildLocaleListRows(localesDir, files, sourceLocale);
    const payload: LocalesListJsonPayload = {
      kind: 'locales-list',
      sourceLocaleCode: path.basename(sourceLocale, '.json'),
      sourceLocalePath: sourceLocale,
      localesDir,
      localeCount: rows.length,
      targetLocaleCount: rows.filter((row) => !row.isSourceLocale).length,
      rows,
    };

    if (ctx.run.json) {
      const envelope = buildCliJsonEnvelope('locales-list', payload, {
        ok: true,
        issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
        cwd: process.cwd(),
      });
      console.log(stringifyEnvelope(envelope));
    } else {
      if (canPrintInfo(ctx.run)) {
        logger.info(`locales list: ${String(payload.localeCount)} locale file(s) in ${localesDir}`, ctx.run);
        for (const row of payload.rows) {
          const extras =
            row.englishIdenticalLeafCount === null
              ? 'source locale'
              : `english-identical: ${String(row.englishIdenticalLeafCount)}`;
          logger.detail(`  ${row.code}.json · leaves ${String(row.leafCount)} · ${extras}`, ctx.run);
        }
      }
      printCommandSummary(
        {
          command: 'locales list',
          ok: true,
          durationMs: Date.now() - started,
          counts: {
            locales: payload.localeCount,
            targets: payload.targetLocaleCount,
          },
          issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
        },
        ctx,
      );
    }
    pushReportEntry({
      command: 'locales list',
      level: 'info',
      message: 'locale files listed',
      data: { localeCount: payload.localeCount, targetLocaleCount: payload.targetLocaleCount },
    });
    await finalizeReportFile(ctx.config, {
      command: 'locales list',
      durationMs: Date.now() - started,
      counts: {
        locales: payload.localeCount,
        targets: payload.targetLocaleCount,
      },
    });
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
      await finalizeReportFile(ctx.config, {
        command: 'locales list',
        ok: false,
        durationMs: Date.now() - started,
        counts: {},
      });
      return;
    }
    throw err;
  }
}
