import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { resolveContext } from '@/core/context/index.js';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { getCliYesFlag } from '@/core/context/globals.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { collectStringLeaves, deleteAtPath } from '@/core/json/index.js';
import { scanProjectLiteralKeyUsage } from '@/core/extractor/index.js';
import {
  computeCleanupCandidateKeys,
  resolveCleanupKeysWithStringPresence,
} from '@/core/cleanup/index.js';
import { localeJsonHasKeyPath } from '@/core/generate/buildLocale.js';
import { buildKeyReferenceContext, resolveReferenceConfig } from '@/core/reference/index.js';
import { readJsonFile, writeJsonFile, listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { isRipgrepAvailable, printRipgrepInstallHint } from '@/utils/rg/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { runCleanupCheck } from '@/core/cleanup/jsonEnvelope.js';
import {
  issuesFromCleanupRipgrepUnavailable,
  issuesFromCleanupUncertainExcluded,
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintDetail } from '@/utils/logger/policy.js';
import { canAsk, promptApprovedRemovalKeys } from '@/core/ask/index.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { CleanupJsonOutput } from '@/types/command/cleanup/json.js';
import type { CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';

export async function cleanup(opts: CleanupOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();

  if (ctx.run.json) {
    const envelope = runCleanupCheck(ctx, opts);
    const durationMs = Date.now() - started;
    const d = envelope.data;
    const withSummary: CliJsonEnvelope<'cleanup', CleanupJsonOutput> = {
      ...envelope,
      data: {
        ...d,
        summary: {
          durationMs,
          command: 'cleanup',
          ok: envelope.ok,
          counts: { remove: d.wouldRemove, dynamicKeySites: d.dynamicKeySites },
        },
      },
    };
    console.log(stringifyEnvelope(withSummary));
    if (!envelope.ok) {
      process.exitCode = 1;
    }
    pushReportEntry({
      level: envelope.ok ? 'info' : 'error',
      command: 'cleanup',
      message: 'cleanup --json',
      data: { remove: d.wouldRemove, dynamicKeySites: d.dynamicKeySites },
    });
    await finalizeReportFile(ctx.config, {
      command: 'cleanup',
      ok: envelope.ok,
      durationMs: Date.now() - started,
      counts: { remove: d.wouldRemove, dynamicKeySites: d.dynamicKeySites },
    });
    return;
  }

  const eff = resolveReferenceConfig('cleanup', ctx.config);
  const refCtx = buildKeyReferenceContext(ctx, eff);
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  if (canPrintInfo(ctx.run)) {
    logger.info('cleanup: scanning source locale and project sources for unused key paths…', ctx.run);
  }
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readJsonFile(sourcePath);
  const leaves = collectStringLeaves(sourceRaw);
  const usage = scanProjectLiteralKeyUsage(ctx);
  const filterUncertain =
    eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only';
  const { allKeyPaths, candidates, excludedUncertain } = computeCleanupCandidateKeys({
    leaves,
    usage,
    preserve: ctx.config.policies?.preserve,
    uncertainPrefixes: refCtx.uncertainPrefixes,
    filterUncertainPrefixes: filterUncertain,
  });

  if (excludedUncertain > 0 && canPrintInfo(ctx.run)) {
    logger.info(
      `cleanup: excluded ${String(excludedUncertain)} path(s) under uncertain key prefix(es) (${eff.uncertainKeyPolicy}).`,
      ctx.run,
    );
  }

  const rgOk = opts.skipRg ? false : isRipgrepAvailable();
  if (!opts.skipRg && !rgOk) printRipgrepInstallHint();
  if (canPrintInfo(ctx.run)) {
    logger.info(
      `cleanup: ${String(allKeyPaths.size)} key path(s) in source JSON · ${String(candidates.length)} unused candidate(s) after preserve / reference rules`,
      ctx.run,
    );
  }
  if (dynamicSites.length > 0 && canPrintInfo(ctx.run)) {
    logger.warn(
      `cleanup: ${String(dynamicSites.length)} non-literal translation call site(s) — see \`reference\` config and \`i18nprune validate\` for detail.`,
      ctx.run,
    );
  }

  const safeToRemove = resolveCleanupKeysWithStringPresence({
    candidates,
    leaves,
    srcRoot: ctx.paths.srcRoot,
    eff,
    skipRg: Boolean(opts.skipRg),
    rgOk,
    logDetail: canPrintDetail(ctx.run) ? (msg) => logger.detail(msg, ctx.run) : undefined,
  });
  const summaryIssues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    issuesFromCleanupUncertainExcluded(excludedUncertain),
    !opts.skipRg && !rgOk ? issuesFromCleanupRipgrepUnavailable() : [],
  );

  if (opts.checkOnly) {
    logger.info(`Would remove ${String(safeToRemove.length)} unused path(s) (check-only)`, ctx.run);
    printCommandSummary(
      {
        command: 'cleanup',
        ok: true,
        durationMs: Date.now() - started,
        counts: { remove: safeToRemove.length, dynamicKeySites: dynamicSites.length },
        issues: summaryIssues,
      },
      ctx,
    );
    pushReportEntry({
      level: 'info',
      command: 'cleanup',
      message: 'check-only',
      data: { remove: safeToRemove.length, dynamicKeySites: dynamicSites.length },
    });
    finalizeReportFile(ctx.config, {
      command: 'cleanup',
      ok: true,
      durationMs: Date.now() - started,
      counts: { remove: safeToRemove.length, dynamicKeySites: dynamicSites.length },
    });
    return;
  }

  let keysToRemove = safeToRemove;

  if (keysToRemove.length === 0) {
    if (canPrintInfo(ctx.run)) {
      logger.info('cleanup: nothing to remove (no unused keys after filters).', ctx.run);
    }
    printCommandSummary(
      {
        command: 'cleanup',
        ok: true,
        durationMs: Date.now() - started,
        counts: { removedPaths: 0, filesWritten: 0, dynamicKeySites: dynamicSites.length },
        issues: summaryIssues,
      },
      ctx,
    );
    finalizeReportFile(ctx.config, {
      command: 'cleanup',
      ok: true,
      durationMs: Date.now() - started,
      counts: { removedPaths: 0, filesWritten: 0, dynamicKeySites: dynamicSites.length },
    });
    return;
  }

  if (!getCliYesFlag()) {
    let granularAskDone = false;
    if (opts.ask && canAsk(ctx.run)) {
      keysToRemove = await promptApprovedRemovalKeys(keysToRemove, {
        mode: opts.askPerKey ? 'each' : 'group',
        localesDirDisplay: ctx.paths.localesDir,
      });
      granularAskDone = true;
      if (keysToRemove.length === 0) {
        if (canPrintInfo(ctx.run)) logger.info('cleanup: aborted (no keys approved for removal).', ctx.run);
        printCommandSummary(
          {
            command: 'cleanup',
            ok: true,
            durationMs: Date.now() - started,
            notes: ['aborted: no keys approved'],
            issues: summaryIssues,
          },
          ctx,
        );
        return;
      }
    } else if (opts.ask && !canAsk(ctx.run) && canPrintInfo(ctx.run)) {
      logger.info('cleanup: --ask ignored (not an interactive terminal).', ctx.run);
    }

    if (!granularAskDone && canAsk(ctx.run)) {
      const ok = await confirm({
        message: `Remove ${String(keysToRemove.length)} unused key path(s) from all locale JSON under ${ctx.paths.localesDir}?`,
        default: false,
      });
      if (!ok) {
        if (canPrintInfo(ctx.run)) logger.info('cleanup: aborted (no files changed).', ctx.run);
        printCommandSummary(
          {
            command: 'cleanup',
            ok: true,
            durationMs: Date.now() - started,
            notes: ['aborted: user declined confirmation'],
            issues: summaryIssues,
          },
          ctx,
        );
        return;
      }
    } else if (!granularAskDone && !canAsk(ctx.run)) {
      throw new I18nPruneError(
        'cleanup: destructive run requires global --yes when non-interactive (or use --check-only)',
        'USAGE',
      );
    }
  }

  if (canPrintInfo(ctx.run)) {
    logger.warn(
      `cleanup: removing ${String(keysToRemove.length)} path(s) from locale files (this affects every locale JSON that still contains them).`,
      ctx.run,
    );
  }

  const dir = ctx.paths.localesDir;
  const files = listJsonBasenamesInDir(dir);
  let writes = 0;
  for (const file of files) {
    const full = path.join(dir, file);
    let data = readJsonFile(full);
    let dirty = false;
    for (const key of keysToRemove) {
      if (localeJsonHasKeyPath(data, key)) {
        data = deleteAtPath(data, key);
        dirty = true;
      }
    }
    if (dirty) {
      writeJsonFile(full, data);
      writes += 1;
      if (canPrintDetail(ctx.run)) {
        logger.detail(`cleanup: wrote ${full}`, ctx.run);
      }
    }
  }

  if (canPrintInfo(ctx.run)) {
    logger.info(`cleanup: finished — ${String(writes)} file(s) updated on disk.`, ctx.run);
  }

  const durationMs = Date.now() - started;
  printCommandSummary(
    {
      command: 'cleanup',
      ok: true,
      durationMs,
      counts: {
        removedPaths: keysToRemove.length,
        filesWritten: writes,
        dynamicKeySites: dynamicSites.length,
      },
      issues: summaryIssues,
    },
    ctx,
  );
  pushReportEntry({
    level: 'info',
    command: 'cleanup',
    message: 'cleanup completed',
    data: { removedPaths: keysToRemove.length, filesWritten: writes, dynamicKeySites: dynamicSites.length },
  });
  finalizeReportFile(ctx.config, {
    command: 'cleanup',
    ok: true,
    durationMs,
    counts: { removedPaths: keysToRemove.length, filesWritten: writes, dynamicKeySites: dynamicSites.length },
  });
}
