import { resolveContext } from '@/shared/context/index.js';
import { formatListShownOmitted, getDocsUrl, dynamicSiteDetailLines } from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { buildCliJsonEnvelope, stringifyEnvelope } from '@i18nprune/core';
import { buildIoReadFailureEnvelope } from '@/shared/result/index.js';
import { cliEnvelopeCwd } from '@/shared/result/envelopeCwd.js';
import { issuesFromDiscoveryWarnings, issuesFromLocalesUsage, mergeIssues } from '@/shared/result/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { getRunOptions, runDynamic } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import { I18nPruneError } from '@i18nprune/core';
import type { LocalesDynamicJsonPayload } from '@/types/command/locales/json.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { DEFAULT_LIST_TOP } from '@i18nprune/core';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { cliReadinessIssues } from '@/shared/project/index.js';

function dynamicListOpts(config: Awaited<ReturnType<typeof resolveContext>>['config']) {
  const window = resolveCliListWindow(config);
  return window.full ? { full: true as const } : { top: window.limit };
}

/**
 * Read-only: list non-literal translation key sites (heuristic scan). No locale or source writes.
 */
export async function localesDynamic(run?: RunOptions): Promise<void> {
  const wall = attachWallTimer();
  const ctx = await resolveContext();
  const r = run ?? getRunOptions();
  const listOpts = dynamicListOpts(ctx.config);
  const emptyPayload: LocalesDynamicJsonPayload = {
    kind: 'locales-dynamic',
    sourceLocalePath: ctx.paths.sourceLocale,
    sourceLocaleCode: 'unknown',
    top: listOpts.full ? null : (listOpts.top ?? DEFAULT_LIST_TOP),
    full: listOpts.full === true,
    shown: 0,
    dynamic: {
      count: 0,
      sites: [],
      groups: {
        mixedConstRuntime: 0,
        templateInterpolation: 0,
        nonLiteral: 0,
        emptyCall: 0,
        commented: 0,
      },
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
    const result = runDynamic(coreCtx, listOpts, { emit: createCliRunEmitter(r), runId });
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
      applyCliCiExitGate(true);
      return;
    }

    if (canPrintInfo(r)) {
      if (allSites.length > 0) {
        logger.warn(
          `${String(allSites.length)} translation call(s) use a non-literal key — listing callsites below (heuristic scan).`,
          r,
        );
      }
      logger.info(
        `${String(allSites.length)} dynamic key site(s) · scan ${ctx.paths.srcRoot} · source ${payload.sourceLocaleCode}`,
        r,
      );
      const { groups } = payload.dynamic;
      if (allSites.length > 0) {
        logger.detail(
          `  · groups: mixed_const_runtime=${String(groups.mixedConstRuntime)} · template_interpolation=${String(groups.templateInterpolation)} · non_literal=${String(groups.nonLiteral)} · empty_call=${String(groups.emptyCall)} · commented=${String(groups.commented)}`,
          r,
        );
      }
      if (allSites.length === 0) {
        logger.detail('  no non-literal key patterns matched configured translation helpers.', r);
      } else {
        for (const s of payload.dynamic.sites) {
          const loc =
            s.filePath !== undefined && s.line !== undefined
              ? `${s.filePath}:${String(s.line)} `
              : '';
          logger.detail(`  · [${s.kind}] ${loc}${s.functionName} — ${s.preview}`, r);
          for (const line of dynamicSiteDetailLines(s)) {
            logger.detail(`      ${line}`, r);
          }
        }
        const omittedSites = allSites.length - payload.dynamic.sites.length;
        if (omittedSites > 0) {
          logger.detail(
            formatListShownOmitted(
              `  · ${String(payload.dynamic.sites.length)} dynamic site(s) shown`,
              omittedSites,
            ),
            r,
          );
        }
      }
      logger.tip(`Patterns: ${getDocsUrl('dynamic/README.md')}`, r);
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
    applyCliCiExitGate(true);
  } catch (err) {
    if (ctx.run.json) {
      const usageIssues =
        err instanceof I18nPruneError && err.code === 'USAGE' ? issuesFromLocalesUsage(err.message) : [];
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
    throw err;
  } finally {
    wall.dispose();
  }
}
