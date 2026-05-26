import { resolveContext } from '@/shared/context/index.js';
import { docsCommandUrl, getDocsUrl } from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@i18nprune/core';
import { buildIoReadFailureEnvelope } from '@/shared/result/index.js';
import { cliEnvelopeCwd } from '@/shared/result/envelopeCwd.js';
import {
  isLocaleTargetMissingMessage,
  issuesFromDiscoveryWarnings,
  issuesFromLocaleTargetMissing,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/shared/result/index.js';
import { logger } from '@/utils/logger/index.js';
import { style } from '@/utils/style/index.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import { getRunOptions, runDynamic } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import { I18nPruneError } from '@i18nprune/core';
import type { LocalesDynamicJsonPayload } from '@/types/command/locales/json.js';
import type { LocalesDynamicOptions } from '@/types/commands/locales/index.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { cliReadinessIssues } from '@/shared/project/index.js';

/**
 * Read-only: list non-literal translation key sites (heuristic scan). No locale or source writes.
 */
export async function localesDynamic(opts: LocalesDynamicOptions = {}, run?: RunOptions): Promise<void> {
  const wall = attachWallTimer();
  const ctx = await resolveContext();
  const r = run ?? getRunOptions();
  const emptyPayload: LocalesDynamicJsonPayload = {
    kind: 'locales-dynamic',
    sourceLocalePath: ctx.paths.sourceLocale,
    sourceLocaleCode: 'unknown',
    top: opts.full ? null : (opts.top ?? 10),
    full: opts.full === true,
    shown: 0,
    dynamic: {
      count: 0,
      sites: [],
    },
  };
  const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'locales-dynamic' });
  if (readiness) {
    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('locales-dynamic', emptyPayload, {
            ok: false,
            issues: readiness,
            cwd: ctx.adapters.system.cwd(),
          }),
        ),
      );
      applyCliCiExitGate(false);
      return;
    }
    if (readiness[0]) logger.warn(readiness[0].message, r);
    printCommandSummary(
      {
        command: 'locales dynamic',
        ok: false,
        durationMs: wall.elapsedMs(),
        counts: { dynamic: 0, keyObservations: 0 },
        issues: readiness,
      },
      ctx,
    );
    applyCliCiExitGate(false);
    return;
  }

  try {
    const coreCtx = createCliCoreContext(ctx);
    const runId = String(Date.now());
    const result = runDynamic(
      coreCtx,
      { top: opts.top, full: opts.full },
      { emit: createCliRunEmitter(r), runId },
    );
    const { payload, issues: coreIssues, allSites } = result;

    const summaryIssues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      coreIssues,
    );

    if (ctx.run.json) {
      console.log(
        stringifyEnvelope(
          buildCliJsonEnvelope('locales-dynamic', payload, {
            ok: true,
            issues: summaryIssues,
            cwd: cliEnvelopeCwd(ctx),
          }),
        ),
      );
      return;
    }

    if (allSites.length > 0 && canPrintWarn(r)) {
      logger.warn(
        `${String(allSites.length)} translation call(s) use a non-literal key — listing callsites below (heuristic scan; see docs for limits).`,
        r,
      );
    }

    if (canPrintInfo(r)) {
      logger.primary('', r);
      logger.primary(style.bold('  Dynamic key sites (heuristic)'), r);
      logger.primary(
        style.dim(`  Scan root: ${ctx.paths.srcRoot} · ${String(allSites.length)} site(s)`),
        r,
      );
      logger.primary(style.dim(`  Source locale: ${payload.sourceLocaleCode}`), r);
      if (allSites.length === 0) {
        logger.primary(style.dim('  No non-literal key patterns matched configured translation helpers.'), r);
      } else {
        for (const s of payload.dynamic.sites) {
          const loc =
            s.filePath !== undefined && s.line !== undefined
              ? `${s.filePath}:${String(s.line)} `
              : '';
          logger.primary(style.dim(`  · [${s.kind}] ${loc}${s.functionName} — ${s.preview}`), r);
        }
        if (allSites.length > payload.dynamic.sites.length) {
          logger.primary(
            style.dim(
              `  … ${String(allSites.length - payload.dynamic.sites.length)} more (use --full or e.g. \`locales dynamic --json --top 50\`)`,
            ),
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
        counts: { dynamic: allSites.length, keyObservations: result.payload.shown },
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
              cwd: cliEnvelopeCwd(ctx),
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
