import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { resolveContext } from '@/shared/context/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { resolvePathsToAddForMissing } from '@/commands/missing/paths.js';
import {
  logMissingPathsPreview,
  resolveMissingHumanDefaultTop,
} from '@/commands/missing/summary.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { DEFAULT_MISSING_LEAF_PLACEHOLDER, setAtPath } from '@i18nprune/core';
import { isSourceLocaleSlug } from '@/shared/locales/source.js';
import { I18nPruneError } from '@i18nprune/core';
import { writeHostJson } from '@/shared/io/hostJson.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import { runMissing } from '@/commands/missing/jsonEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromMissingSkippedNotInScan,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import { canAsk } from '@/shared/ask/index.js';
import { noopRunEmitter } from '@i18nprune/core';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type { MissingOptions } from '@/types/command/missing/index.js';
import type { MissingPathDisplayOpts } from '@/types/command/missing/summary.js';
import { resolveMissingTargetState } from './target.js';
import { resolveDynamicSitesCount, resolveMissingResolvedKeys } from '@/shared/cache/index.js';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';

function resolveMissingData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
  opts: MissingOptions,
): {
  target: ReturnType<typeof resolveMissingTargetState>;
  toAdd: string[];
  skippedNotInScan: string[];
} {
  const target = resolveMissingTargetState(ctx, opts);
  const localeJson = target.localeJson;
  const resolvedKeys = resolveMissingResolvedKeys(ctx);
  const { toAdd, skippedNotInScan } = resolvePathsToAddForMissing(ctx, localeJson, { resolvedKeys });
  return { target, toAdd, skippedNotInScan };
}

export async function missing(opts: MissingOptions): Promise<void> {
  assertMissingTop(opts);
  const wall = attachWallTimer();
  try {
    const runId = String(Date.now());
    const ctx = await resolveContext();
    const { paths, run } = ctx;

    if (run.json) {
      const envelope = runMissing(ctx, opts, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
      }
      return;
    }

    const display = missingDisplayOpts(opts, ctx.config);

    const resolved = resolveMissingData(ctx, opts);
    const target = resolved.target;
    const targetPath = target.targetPath;
    let localeJson = target.localeJson;
    const dynamicSites = resolveDynamicSitesCount(ctx);

    if (dynamicSites > 0 && canPrintWarn(run)) {
      logger.warn(
        `${String(dynamicSites)} translation call(s) use a non-literal key — missing only adds paths for literal keys seen in the scan; use \`validate\` or \`locales dynamic\` for dynamic call sites.`,
        run,
      );
    }

    if (target.targetKind === 'locale' && target.selectedLocaleCode && canPrintWarn(run)) {
      if (!isSourceLocaleSlug(target.selectedLocaleCode, paths.sourceLocale, ctx)) {
        logger.warn(
          `writing ${path.basename(targetPath)} — validate still compares code to the source locale file until it matches.`,
          run,
        );
      }
    }

    const { toAdd, skippedNotInScan } = resolved;
    const summaryIssues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDynamicScanCount(dynamicSites),
      issuesFromMissingSkippedNotInScan(skippedNotInScan),
    );

    if (skippedNotInScan.length > 0 && canPrintInfo(run)) {
      logger.detail(
        `${String(skippedNotInScan.length)} path(s) not in current code scan (ignored).`,
        run,
      );
    }

    if (toAdd.length === 0) {
      if (canPrintInfo(run)) {
        logger.info('nothing to add (all scanned keys already present in target JSON).', run);
      }
      printCommandSummary(
        {
          command: 'missing',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: { added: 0 },
          issues: summaryIssues,
        },
        ctx,
      );
      return;
    }

    const missingPlaceholder =
      ctx.config.missing?.placeholder !== undefined
        ? ctx.config.missing.placeholder
        : DEFAULT_MISSING_LEAF_PLACEHOLDER;

    if (opts.dryRun) {
      if (canPrintInfo(run)) {
        logger.info(
          `would add ${String(toAdd.length)} path(s) to ${targetPath} (placeholder ${JSON.stringify(missingPlaceholder)}):`,
          run,
        );
      }
      logMissingPathsPreview(toAdd, display, run);
      printCommandSummary(
        {
          command: 'missing',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: { wouldAdd: toAdd.length },
          issues: summaryIssues,
        },
        ctx,
      );
      return;
    }

    if (canPrintInfo(run)) {
      logger.info(`will add ${String(toAdd.length)} path(s) to ${targetPath}:`, run);
    }
    logMissingPathsPreview(toAdd, display, run);

    if (canAsk(run) && !getCliYesFlag()) {
      const preview =
        missingPlaceholder === '' ? 'empty string values' : `placeholder ${JSON.stringify(missingPlaceholder)}`;
      const ok = await duringPrompt(() =>
        confirm({
          message: `Add ${String(toAdd.length)} key path(s) with ${preview} to ${targetPath}?`,
          default: false,
        }),
      );
      if (!ok) {
        if (canPrintInfo(run)) logger.info('aborted (no files changed).', run);
        printCommandSummary(
          {
            command: 'missing',
            ok: true,
            durationMs: wall.elapsedMs(),
            notes: ['aborted: user declined confirmation'],
            issues: summaryIssues,
          },
          ctx,
        );
        return;
      }
    } else if (!canAsk(run) && !getCliYesFlag()) {
      throw new I18nPruneError(
        'missing: non-interactive run requires global --yes to write files (or use --dry-run)',
        'USAGE',
      );
    }

    let next: unknown = localeJson;
    for (const p of toAdd) {
      next = setAtPath(next, p, missingPlaceholder);
    }
    writeHostJson(targetPath, next, ctx.adapters.fs);

    if (canPrintInfo(run)) {
      logger.info(`added ${String(toAdd.length)} path(s) to ${targetPath}`, run);
    }
    logMissingPathsPreview(toAdd, display, run);

    printCommandSummary(
      {
        command: 'missing',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: { added: toAdd.length },
        issues: summaryIssues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}

function assertMissingTop(opts: MissingOptions): void {
  if (opts.top === undefined) return;
  if (typeof opts.top !== 'number' || !Number.isInteger(opts.top) || opts.top < 1) {
    throw new I18nPruneError('missing: top must be a positive integer', 'USAGE');
  }
}

function missingDisplayOpts(opts: MissingOptions, config: I18nPruneConfig): MissingPathDisplayOpts {
  const window = resolveCliListWindow(config, {
    top: opts.top ?? resolveMissingHumanDefaultTop(config),
    full: opts.fullList === true,
  });
  return { fullList: false, top: window.limit };
}
