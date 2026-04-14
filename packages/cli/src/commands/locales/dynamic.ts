import { resolveContext } from '@/core/context/index.js';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { docsCommandUrl, getDocsUrl } from '@/constants/docs.js';
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
import { logger } from '@/utils/logger/index.js';
import { style } from '@/utils/style/index.js';
import { canPrintDecorative } from '@/utils/logger/policy.js';
import { getRunOptions } from '@/core/runtime/options.js';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import type { LocalesDynamicJsonPayload } from '@/types/command/locales/json.js';
import type { LocalesDynamicOptions } from '@/types/commands/locales/index.js';

/**
 * Read-only: list non-literal translation key sites (heuristic scan). No locale or source writes.
 */
export async function localesDynamic(opts: LocalesDynamicOptions = {}, run?: RunOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const r = run ?? getRunOptions();
  const top = opts.top;
  const full = opts.full === true;
  const emptyPayload: LocalesDynamicJsonPayload = {
    kind: 'locales-dynamic',
    sourceLocalePath: ctx.paths.sourceLocale,
    sourceLocaleCode: 'unknown',
    top: top ?? null,
    full,
    shown: 0,
    dynamic: {
      count: 0,
      sites: [],
    },
  };
  try {
    const sites = scanProjectDynamicKeySites(ctx);
    const sourceLocaleCode = ctx.paths.sourceLocale.split('/').at(-1)?.replace(/\.json$/, '') ?? 'unknown';
    const limit = full ? sites.length : (top ?? 10);
    const shownSites = sites.slice(0, limit);
    const payload: LocalesDynamicJsonPayload = {
      kind: 'locales-dynamic',
      sourceLocalePath: ctx.paths.sourceLocale,
      sourceLocaleCode,
      top: full ? null : (top ?? 10),
      full,
      shown: shownSites.length,
      dynamic: {
        count: sites.length,
        sites,
      },
    };

    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('locales-dynamic', payload, {
            ok: true,
            issues: issuesFromDiscoveryWarnings(ctx.meta.warnings),
            cwd: process.cwd(),
          }),
        ),
      );
      pushReportEntry({
        command: 'locales dynamic',
        level: 'info',
        message: 'dynamic sites scanned',
        data: { count: sites.length, sourceLocaleCode, shown: shownSites.length },
      });
      finalizeReportFile(ctx.config, {
        command: 'locales dynamic',
        durationMs: Date.now() - started,
        counts: { dynamicSites: sites.length, shown: shownSites.length },
      });
      return;
    }

    if (!canPrintDecorative(r)) {
      pushReportEntry({
        command: 'locales dynamic',
        level: 'info',
        message: 'dynamic sites scanned',
        data: { count: sites.length, sourceLocaleCode, shown: shownSites.length },
      });
      finalizeReportFile(ctx.config, {
        command: 'locales dynamic',
        durationMs: Date.now() - started,
        counts: { dynamicSites: sites.length, shown: shownSites.length },
      });
      return;
    }

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
        logger.primary(style.dim(`  … ${String(sites.length - shownSites.length)} more (see validate --json)`), r);
      }
    }
    logger.primary(style.dim(`  Patterns: ${getDocsUrl('dynamic/README.md')}`), r);
    logger.primary(style.dim(`  Command docs: ${docsCommandUrl('locales/dynamic')}`), r);
    pushReportEntry({
      command: 'locales dynamic',
      level: 'info',
      message: 'dynamic sites scanned',
      data: { count: sites.length, sourceLocaleCode, shown: shownSites.length },
    });
    finalizeReportFile(ctx.config, {
      command: 'locales dynamic',
      durationMs: Date.now() - started,
      counts: { dynamicSites: sites.length, shown: shownSites.length },
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
