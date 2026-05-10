import { I18nPruneError } from '@i18nprune/core';
import {
  createCoreContext,
  normalizeGeneratePromptLang,
  parseLocaleCodesList,
  pickTargetSelector,
  runGenerate,
} from '@i18nprune/core';
import { canAsk } from '@/shared/ask/index.js';
import { resolveLocalesDynamicSites } from '@/shared/cache/index.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEmitter, RunEvent } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';
import { canPrintWarn } from '@/utils/logger/policy.js';
import { promptLanguageCodeOnly } from '@/commands/generate/prompts.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { GenerateJsonPayload } from '@/types/command/generate/json.js';
import type { Context } from '@/types/core/context/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import { buildGenerateHostHooks } from '@/commands/generate/hostBridge.js';
import { readHostJsonUnknown } from '@/shared/io/hostJson.js';
import { resolveFromCwd } from '@/utils/paths/index.js';

/**
 * Generate workflow: discovery warnings + source read + target resolution (CLI-only), then core
 * {@link runGenerate} orchestration.
 */
export async function executeGenerate(
  ctx: Context,
  merged: GenerateOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): Promise<{ payload: GenerateJsonPayload; issues: Issue[] }> {
  const emit = runtime?.emit;
  const runId = runtime?.runId;
  const emitProgress = (
    e: Omit<Extract<RunEvent, { type: 'run.progress.generate' }>, 'op' | 'runId' | 'at'>,
  ): void => {
    emitRunEvent(emit, { op: 'generate', runId, at: nowMs(), ...e });
  };

  emitProgress({ type: 'run.progress.generate', phase: 'scan_dynamic_sites' });
  const dynamicSites = resolveLocalesDynamicSites(ctx);
  if (dynamicSites.length > 0 && canPrintWarn(ctx.run)) {
    logger.warn(
      `${String(dynamicSites.length)} translation call(s) use a non-literal key — generation follows source JSON paths only; computed keys are not enumerated here.`,
      ctx.run,
    );
  }

  const sourcePath = merged.source ? resolveFromCwd(merged.source) : ctx.paths.sourceLocale;
  emitProgress({ type: 'run.progress.generate', phase: 'read_source', label: sourcePath });
  const raw = readHostJsonUnknown(sourcePath, ctx.adapters.fs);

  const rawTarget = pickTargetSelector(merged.target);
  if (!rawTarget) {
    if (!canAsk(ctx.run)) {
      throw new I18nPruneError(
        'generate requires --target when running non-interactively (--json or CI)',
        'USAGE',
      );
    }
  }
  const targets = rawTarget
    ? parseLocaleCodesList(rawTarget)
    : [normalizeGeneratePromptLang((await promptLanguageCodeOnly(ctx.run)).trim())];
  if (targets.length === 0) {
    throw new I18nPruneError('generate: no target locale codes provided', 'USAGE');
  }

  const coreCtx = createCoreContext({
    config: ctx.config,
    adapters: ctx.adapters,
    env: process.env,
    paths: ctx.paths,
    run: ctx.run,
  });

  const { payload, issues: coreIssues } = await runGenerate(
    coreCtx,
    {
      targets,
      dynamicKeySites: dynamicSites.length,
      source: merged.source,
      preloadedRaw: raw,
      provider: merged.provider,
      workers: merged.workers,
      englishName: merged.englishName,
      nativeName: merged.nativeName,
      direction: merged.direction,
      force: merged.force,
      dryRun: merged.dryRun,
      metadata: merged.metadata,
      noLocaleMeta: merged.noLocaleMeta,
    },
    buildGenerateHostHooks(ctx, merged, runtime),
  );

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    coreIssues,
  );

  return { payload, issues };
}

export { resolveGenerateDirectionDefault } from '@i18nprune/core';
