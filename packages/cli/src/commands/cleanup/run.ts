import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { resolveContext } from '@/shared/context/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import {
  I18nPruneError,
  applyCleanupKeysToLocaleJson,
  collectStringLeaves,
  computeCleanupCandidateKeys,
  extractor,
  noopRunEmitter,
} from '@i18nprune/core';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';
import { resolveCleanupKeysWithStringPresence } from '@/shared/cleanup/stringPresence.js';
import { buildKeyReferenceContext } from '@/shared/reference/context.js';
import { resolveReferenceConfig } from '@i18nprune/core';
import { listHostJsonBasenames, readHostJsonUnknown } from '@/shared/io/hostJson.js';
import { writeHostJson } from '@/shared/io/hostJson.js';
import { isRipgrepAvailable, printRipgrepInstallHint } from '@/utils/rg/index.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import { runCleanupCheck } from '@/commands/cleanup/jsonEnvelope.js';
import {
  issuesFromCleanupRipgrepUnavailable,
  issuesFromCleanupUncertainExcluded,
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { resolveExtractionBaselineCounts } from '@/shared/cache/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDetail, canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import { canAsk, promptApprovedRemovalKeys } from '@/shared/ask/index.js';
import type { CleanupJsonOutput } from '@/types/command/cleanup/json.js';
import type { CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';

function resolveCleanupJsonData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
  opts: CleanupOptions,
  runId: string,
): ReturnType<typeof runCleanupCheck> {
  return runCleanupCheck(ctx, opts, { emit: noopRunEmitter, runId });
}

export async function cleanup(opts: CleanupOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const runId = String(Date.now());

    if (ctx.run.json) {
      const envelope = resolveCleanupJsonData(ctx, opts, runId);
      const durationMs = wall.elapsedMs();
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
      return;
    }

    const eff = resolveReferenceConfig('cleanup', ctx.config);
    const refCtx = buildKeyReferenceContext(ctx, eff);
    const scanInput = toExtractorScanInput(ctx);
    const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites(scanInput);
    const extractionBaseline = resolveExtractionBaselineCounts(ctx);
    if (canPrintInfo(ctx.run)) {
      logger.info('scanning source locale and project sources for unused key paths…', ctx.run);
    }
    const sourcePath = ctx.paths.sourceLocale;
    const sourceRaw = readHostJsonUnknown(sourcePath, ctx.adapters.fs);
    const leaves = collectStringLeaves(sourceRaw);
    const usage = extractor.keySites.scanProjectLiteralKeyUsage(scanInput);
    const filterUncertain = eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only';
    const { allKeyPaths, candidates, excludedUncertain } = computeCleanupCandidateKeys({
      leaves,
      usage,
      preserve: ctx.config.policies?.preserve,
      uncertainPrefixes: refCtx.uncertainPrefixes,
      filterUncertainPrefixes: filterUncertain,
    });

    if (excludedUncertain > 0 && canPrintInfo(ctx.run)) {
      logger.info(
        `excluded ${String(excludedUncertain)} path(s) under uncertain key prefix(es) (${eff.uncertainKeyPolicy}).`,
        ctx.run,
      );
    }

    const rgOk = opts.skipRg ? false : isRipgrepAvailable();
    if (!opts.skipRg && !rgOk) printRipgrepInstallHint();
    if (canPrintInfo(ctx.run)) {
      logger.info(
        `${String(allKeyPaths.size)} key path(s) in source JSON · ${String(candidates.length)} unused candidate(s) after preserve / reference rules`,
        ctx.run,
      );
    }
    if (dynamicSites.length > 0 && canPrintWarn(ctx.run)) {
      logger.warn(
        `${String(dynamicSites.length)} translation call(s) use a non-literal key — cleanup literal-key inference may miss usage; tighten \`reference\` uncertain-key rules or inspect \`i18nprune validate\` / \`locales dynamic\`.`,
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
          durationMs: wall.elapsedMs(),
          counts: { remove: safeToRemove.length, ...extractionBaseline },
          issues: summaryIssues,
        },
        ctx,
      );
      return;
    }

    let keysToRemove = safeToRemove;

    if (keysToRemove.length === 0) {
      if (canPrintInfo(ctx.run)) {
        logger.info('nothing to remove (no unused keys after filters).', ctx.run);
      }
      printCommandSummary(
        {
          command: 'cleanup',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: { removedPaths: 0, filesWritten: 0, dynamicKeySites: dynamicSites.length },
          issues: summaryIssues,
        },
        ctx,
      );
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
          if (canPrintInfo(ctx.run)) logger.info('aborted (no keys approved for removal).', ctx.run);
          printCommandSummary(
            {
              command: 'cleanup',
              ok: true,
              durationMs: wall.elapsedMs(),
              counts: extractionBaseline,
              notes: ['aborted: no keys approved'],
              issues: summaryIssues,
            },
            ctx,
          );
          return;
        }
      } else if (opts.ask && !canAsk(ctx.run) && canPrintInfo(ctx.run)) {
        logger.info('--ask ignored (not an interactive terminal).', ctx.run);
      }

      if (!granularAskDone && canAsk(ctx.run)) {
        const ok = await duringPrompt(() =>
          confirm({
            message: `Remove ${String(keysToRemove.length)} unused key path(s) from all locale JSON under ${ctx.paths.localesDir}?`,
            default: false,
          }),
        );
        if (!ok) {
          if (canPrintInfo(ctx.run)) logger.info('aborted (no files changed).', ctx.run);
          printCommandSummary(
            {
              command: 'cleanup',
              ok: true,
              durationMs: wall.elapsedMs(),
              counts: extractionBaseline,
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
        `removing ${String(keysToRemove.length)} path(s) from locale files (this affects every locale JSON that still contains them).`,
        ctx.run,
      );
    }

    const dir = ctx.paths.localesDir;
    const files = listHostJsonBasenames(dir, ctx.adapters.fs);
    let writes = 0;
    for (const file of files) {
      const full = path.join(dir, file);
      const data = readHostJsonUnknown(full, ctx.adapters.fs);
      const applied = applyCleanupKeysToLocaleJson(data, keysToRemove);
      if (applied.removedPaths.length > 0) {
        writeHostJson(full, applied.next, ctx.adapters.fs);
        writes += 1;
        if (canPrintDetail(ctx.run)) {
          logger.detail(`wrote ${full}`, ctx.run);
        }
      }
    }

    if (canPrintInfo(ctx.run)) {
      logger.info(`finished — ${String(writes)} file(s) updated on disk.`, ctx.run);
    }

    printCommandSummary(
      {
        command: 'cleanup',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: {
          removedPaths: keysToRemove.length,
          filesWritten: writes,
          ...extractionBaseline,
        },
        issues: summaryIssues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
