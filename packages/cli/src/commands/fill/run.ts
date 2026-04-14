import { resolveContext } from '@/core/context/index.js';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import {
  confirmFillAsk,
  executeFillWithTargets,
  resolveFillLanguages,
} from '@/core/fill/executeFill.js';
import { runFill } from '@/core/fill/runFill.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import {
  isLocaleTargetMissingMessage,
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromLocaleTargetMissing,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { logger } from '@/utils/logger/index.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { FillOptions } from '@/types/command/fill/index.js';
import type { Issue } from '@/types/core/json/envelope.js';

export async function fill(opts: FillOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  try {
    if (ctx.run.json) {
      const envelope = await runFill(ctx, opts);
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
        await finalizeReportFile(ctx.config, {
          command: 'fill',
          ok: false,
          durationMs: Date.now() - started,
          counts: {},
        });
        return;
      }
      const payload = envelope.data;
      pushReportEntry({
        level: 'info',
        command: 'fill',
        message: opts.dryRun ? 'fill dry-run completed' : 'fill completed',
        data: {
          targets: payload.targets,
          updated: payload.updated,
          dryRun: Boolean(opts.dryRun),
          dynamicKeySites: payload.dynamicKeySites,
        },
      });
      await finalizeReportFile(ctx.config, {
        command: 'fill',
        ok: true,
        durationMs: Date.now() - started,
        counts: { locales: payload.targets.length, updated: payload.updated },
      });
      return;
    }

    const dynamicSites = scanProjectDynamicKeySites(ctx);
    const summaryIssues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDynamicScanCount(dynamicSites.length),
    );
    if (dynamicSites.length > 0 && canPrintInfo(ctx.run)) {
      logger.info(
        `fill: ${String(dynamicSites.length)} non-literal translation call site(s) — only source JSON paths are filled; computed keys are not enumerated here.`,
        ctx.run,
      );
    }
    const targets = await resolveFillLanguages(ctx, opts);
    if (!(await confirmFillAsk(ctx, opts, targets))) {
      if (canPrintInfo(ctx.run)) logger.info('fill: aborted (no files changed).', ctx.run);
      printCommandSummary(
        {
          command: 'fill',
          ok: true,
          durationMs: Date.now() - started,
          notes: ['aborted: user declined --ask confirmation'],
          issues: summaryIssues,
        },
        ctx,
      );
      return;
    }

    const { payload } = await executeFillWithTargets(ctx, opts, targets, dynamicSites);
    const durationMs = Date.now() - started;

    printCommandSummary(
      {
        command: 'fill',
        ok: true,
        durationMs,
        counts: {
          locales: payload.targets.length,
          updated: payload.updated,
          sourceLeaves: payload.sourceLeaves,
          dynamicKeySites: payload.dynamicKeySites,
        },
        issues: summaryIssues,
      },
      ctx,
    );

    pushReportEntry({
      level: 'info',
      command: 'fill',
      message: 'fill completed',
      data: {
        targets: payload.targets,
        updated: payload.updated,
        dryRun: Boolean(opts.dryRun),
        dynamicKeySites: payload.dynamicKeySites,
      },
    });
    await finalizeReportFile(ctx.config, {
      command: 'fill',
      ok: true,
      durationMs,
      counts: { locales: payload.targets.length, updated: payload.updated },
    });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    const embedded = err && typeof err === 'object' && 'issues' in err ? (err as { issues?: Issue[] }).issues : [];
    if (embedded && embedded.length > 0) {
      printCommandSummary(
        {
          command: 'fill',
          ok: false,
          durationMs: Date.now() - started,
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), embedded),
        },
        ctx,
      );
      process.exitCode = 1;
      return;
    }
    if (err instanceof I18nPruneError && err.code === 'USAGE' && isLocaleTargetMissingMessage(errMessage)) {
      printCommandSummary(
        {
          command: 'fill',
          ok: false,
          durationMs: Date.now() - started,
          issues: mergeIssues(
            issuesFromDiscoveryWarnings(ctx.meta.warnings),
            issuesFromLocaleTargetMissing(errMessage),
          ),
        },
        ctx,
      );
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}
