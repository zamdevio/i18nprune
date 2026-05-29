import { resolveContext } from '@/shared/context/index.js';
import { I18nPruneError, runLocalesList } from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@i18nprune/core';
import { buildIoReadFailureEnvelope } from '@/shared/result/index.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/shared/result/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import type { LocalesListJsonPayload } from '@/types/command/locales/json.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { cliEnvelopeCwd } from '@/shared/result/envelopeCwd.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { cliReadinessIssues } from '@/shared/project/index.js';

function emptyListPayload(localesDir: string, sourceLocalePath: string, pathPort: { basename(p: string, ext?: string): string }): LocalesListJsonPayload {
  const sourceLocaleCode = pathPort.basename(sourceLocalePath, '.json');
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
  const wall = attachWallTimer();
  const ctx = await resolveContext();
  const { localesDir, sourceLocale } = ctx.paths;

  const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'locales-list' });
  if (readiness) {
    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('locales-list', emptyListPayload(localesDir, sourceLocale, ctx.adapters.path), {
            ok: false,
            issues: readiness,
            cwd: ctx.adapters.system.cwd(),
          }),
        ),
      );
      applyCliCiExitGate(false);
      return;
    }
    if (readiness[0]) logger.warn(readiness[0].message, ctx.run);
    printCommandSummary(
      {
        command: 'locales list',
        ok: false,
        durationMs: wall.elapsedMs(),
        counts: { locales: 0, targets: 0 },
        issues: readiness,
      },
      ctx,
    );
    applyCliCiExitGate(false);
    return;
  }

  try {
    const coreCtx = createCliCoreContext(ctx);
    const { payload } = runLocalesList(coreCtx);

    if (ctx.run.json) {
      const envelope = buildCliJsonEnvelope('locales-list', payload, {
        ok: true,
        issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
        cwd: cliEnvelopeCwd(ctx),
      });
      console.log(stringifyEnvelope(envelope));
    } else {
      const window = resolveCliListWindow(ctx.config, { defaultFull: true });
      const shownRows = payload.rows.slice(0, window.limit);
      if (canPrintInfo(ctx.run)) {
        logger.info(`${String(payload.localeCount)} locale(s) in ${localesDir}`, ctx.run);
        for (const row of shownRows) {
          const extras =
            row.englishIdenticalLeafCount === null
              ? 'source locale'
              : `source-identical: ${String(row.englishIdenticalLeafCount)}`;
          const files =
            row.segmentCount > 1
              ? `${String(row.segmentCount)} segment files`
              : (row.segmentRelativePaths[0] ?? `${row.code}.json`);
          logger.detail(`  ${row.code} · ${files} · leaves ${String(row.leafCount)} · ${extras}`, ctx.run);
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
          ? buildCliJsonEnvelope('locales-list', emptyListPayload(localesDir, sourceLocale, ctx.adapters.path), {
              ok: false,
              issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), usageIssues),
              cwd: cliEnvelopeCwd(ctx),
            })
          : buildIoReadFailureEnvelope('locales-list', emptyListPayload(localesDir, sourceLocale, ctx.adapters.path), ctx, err);
      console.log(stringifyEnvelope(envelope));
      process.exitCode = 1;
      return;
    }
    throw err;
  } finally {
    wall.dispose();
  }
}
