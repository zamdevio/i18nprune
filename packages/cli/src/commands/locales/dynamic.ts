import { resolveContext } from '@/shared/context/index.js';
import { docsCommandUrl, getDocsUrl } from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import {
  isLocaleTargetMissingMessage,
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromLocaleTargetMissing,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { logger } from '@/utils/logger/index.js';
import { style } from '@/utils/style/index.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import { getRunOptions } from '@i18nprune/core';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { I18nPruneError } from '@i18nprune/core';
import type { LocalesDynamicJsonPayload } from '@/types/command/locales/json.js';
import type { LocalesDynamicOptions } from '@/types/commands/locales/index.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { resolveLocalesDynamicSites } from '@/shared/cache/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';

/**
 * Read-only: list non-literal translation key sites (heuristic scan). No locale or source writes.
 */
export async function localesDynamic(opts: LocalesDynamicOptions = {}, run?: RunOptions): Promise<void> {
  const wall = attachWallTimer();
  const ctx = await resolveContext();
  const r = run ?? getRunOptions();
  const window = resolveCliListWindow(ctx.config, {
    top: opts.top,
    full: opts.full === true,
    defaultTop: 10,
  });
  const full = opts.full === true;
  const emptyPayload: LocalesDynamicJsonPayload = {
    kind: 'locales-dynamic',
    sourceLocalePath: ctx.paths.sourceLocale,
    sourceLocaleCode: 'unknown',
    top: full ? null : window.limit,
    full: window.full,
    shown: 0,
    dynamic: {
      count: 0,
      sites: [],
    },
  };
  try {
    const sites = resolveLocalesDynamicSites(ctx);
    const sourceLocaleCode = ctx.paths.sourceLocale.split('/').at(-1)?.replace(/\.json$/, '') ?? 'unknown';
    const shownSites = sites.slice(0, window.limit);
    const payload: LocalesDynamicJsonPayload = {
      kind: 'locales-dynamic',
      sourceLocalePath: ctx.paths.sourceLocale,
      sourceLocaleCode,
      top: window.full ? null : window.limit,
      full: window.full,
      shown: shownSites.length,
      dynamic: {
        count: sites.length,
        sites: shownSites,
      },
    };

    const summaryIssues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDynamicScanCount(sites.length),
    );

    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('locales-dynamic', payload, {
            ok: true,
            issues: summaryIssues,
            cwd: process.cwd(),
          }),
        ),
      );
      return;
    }

    if (sites.length > 0 && canPrintWarn(r)) {
      logger.warn(
        `${String(sites.length)} translation call(s) use a non-literal key — listing callsites below (heuristic scan; see docs for limits).`,
        r,
      );
    }

    if (canPrintInfo(r)) {
      logger.primary('', r);
      logger.primary(style.bold('  Dynamic key sites (heuristic)'), r);
      logger.primary(
        style.dim(`  Scan root: ${ctx.paths.srcRoot} · ${String(sites.length)} site(s)`),
        r,
      );
      logger.primary(style.dim(`  Source locale: ${sourceLocaleCode}`), r);
      if (sites.length === 0) {
        logger.primary(style.dim('  No non-literal key patterns matched configured translation helpers.'), r);
      } else {
        for (const s of shownSites) {
          const loc =
            s.filePath !== undefined && s.line !== undefined
              ? `${s.filePath}:${String(s.line)} `
              : '';
          logger.primary(style.dim(`  · [${s.kind}] ${loc}${s.functionName} — ${s.preview}`), r);
        }
        if (sites.length > shownSites.length) {
          logger.primary(
            style.dim(`  … ${String(sites.length - shownSites.length)} more (use --full or \`locales dynamic --json\`)`),
            r,
          );
        }
      }
      logger.primary(style.dim(`  Patterns: ${getDocsUrl('dynamic/README.md')}`), r);
      logger.primary(style.dim(`  Command docs: ${docsCommandUrl('locales/dynamic')}`), r);
    }

    printCommandSummary(
      {
        command: 'locales dynamic',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: { dynamicKeySites: sites.length },
        issues: summaryIssues,
      },
      ctx,
    );
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
          ? buildCliJsonEnvelope('locales-dynamic', emptyPayload, {
              ok: false,
              issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), usageIssues),
              cwd: process.cwd(),
            })
          : buildIoReadFailureEnvelope('locales-dynamic', emptyPayload, ctx, err);
      console.log(stringifyEnvelope(envelope));
      process.exitCode = 1;
      return;
    }
    if (usageIssues.length > 0) {
      printCommandSummary(
        {
          command: 'locales dynamic',
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
