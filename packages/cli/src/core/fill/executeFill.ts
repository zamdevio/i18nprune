import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { collectStringLeaves } from '@/core/json/index.js';
import { fillOneLocale, promptFillLanguageSelection } from '@/core/fill/index.js';
import { listOtherLocaleCodes } from '@/core/locales/otherLocales.js';
import { readJsonFile } from '@/utils/fs/index.js';
import { buildKeyReferenceContext, resolveReferenceConfig } from '@/core/reference/index.js';
import { canAsk } from '@/core/ask/index.js';
import { validateTargetLanguageCode, normalizeLanguageCode } from '@/core/languages/index.js';
import { assertNotSourceTargetLocale } from '@/core/locales/source.js';
import { getCliYesFlag } from '@/core/context/globals.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { logger } from '@/utils/logger/index.js';
import { parseLocaleCodesList, isAllLangToken, pickTargetSelector } from '@/utils/cli/args.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/core/result/cliEnvelopeIssues.js';
import type { FillJsonPayload, FillTargetJsonRow } from '@/types/command/fill/json.js';
import type { FillOptions } from '@/types/command/fill/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { DynamicKeySite } from '@/types/core/extractor/dynamic/index.js';
import type { Issue } from '@/types/core/json/envelope.js';

export async function resolveFillLanguages(ctx: Context, opts: FillOptions): Promise<string[]> {
  const sourceBase = path.basename(ctx.paths.sourceLocale, '.json');
  if (opts.all) {
    const codes = listOtherLocaleCodes(ctx.paths.localesDir, sourceBase);
    if (codes.length === 0) {
      throw new I18nPruneError('fill: no target locales to fill (besides source).', 'USAGE');
    }
    return codes.map((c) => normalizeLanguageCode(c));
  }
  const raw = pickTargetSelector(opts.target);
  if (!raw) {
    if (!canAsk(ctx.run)) {
      throw new I18nPruneError('fill requires --target or --all (non-interactive)', 'USAGE');
    }
    const picked = await promptFillLanguageSelection(ctx.paths.localesDir, sourceBase, ctx.run);
    if (isAllLangToken(picked)) {
      const codes = listOtherLocaleCodes(ctx.paths.localesDir, sourceBase);
      if (codes.length === 0) {
        throw new I18nPruneError('fill: no target locales to fill (besides source).', 'USAGE');
      }
      return codes.map((c) => normalizeLanguageCode(c));
    }
    const code = normalizeLanguageCode(picked);
    assertNotSourceTargetLocale('fill', code, ctx.paths.sourceLocale, ctx);
    validateTargetLanguageCode(code);
    return [code];
  }
  if (isAllLangToken(raw)) {
    const codes = listOtherLocaleCodes(ctx.paths.localesDir, sourceBase);
    if (codes.length === 0) {
      throw new I18nPruneError('fill: no target locales to fill (besides source).', 'USAGE');
    }
    return codes.map((c) => normalizeLanguageCode(c));
  }
  if (raw.includes(',')) {
    const codes = parseLocaleCodesList(raw);
    for (const c of codes) {
      assertNotSourceTargetLocale('fill', c, ctx.paths.sourceLocale, ctx);
      validateTargetLanguageCode(c);
    }
    return codes;
  }
  const code = normalizeLanguageCode(raw);
  assertNotSourceTargetLocale('fill', code, ctx.paths.sourceLocale, ctx);
  validateTargetLanguageCode(code);
  return [code];
}

/**
 * Scan + read source + fill targets. Caller resolves **`targets`** (after optional **`--ask`** confirm).
 */
export async function executeFillWithTargets(
  ctx: Context,
  opts: FillOptions,
  targets: string[],
  dynamicSites: DynamicKeySite[],
): Promise<{ payload: FillJsonPayload; issues: Issue[] }> {
  const eff = resolveReferenceConfig('fill', ctx.config);
  const refCtx = buildKeyReferenceContext(ctx, eff);
  const sourceRaw = readJsonFile(ctx.paths.sourceLocale);
  const sourceLeaves = collectStringLeaves(sourceRaw);
  const sourceMap = new Map(sourceLeaves.map((l) => [l.path, l.value]));

  let totalUpdated = 0;
  const targetResults: FillTargetJsonRow[] = [];
  let targetIssues: Issue[] = [];
  for (const target of targets) {
    const result = await fillOneLocale(ctx, opts, target, sourceMap, refCtx, eff);
    totalUpdated += result.updated;
    targetIssues = mergeIssues(targetIssues, result.issues);
    targetResults.push({
      target,
      status: opts.dryRun ? 'dry_run' : 'written',
      updated: result.updated,
      paths: { localeJson: result.targetPath, metaJson: result.metaPath },
      progress: result.progress,
    });
  }

  const payload: FillJsonPayload = {
    kind: 'fill',
    dryRun: Boolean(opts.dryRun),
    ...(opts.noMeta === true ? { noMeta: true } : {}),
    targets,
    updated: totalUpdated,
    sourceLeaves: sourceLeaves.length,
    dynamicKeySites: dynamicSites.length,
    targetResults,
  };
  return {
    payload,
    issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), targetIssues),
  };
}

/** Interactive **`--ask`** confirmation; returns **`false`** if the user declined. */
export async function confirmFillAsk(
  ctx: Context,
  opts: FillOptions,
  targets: string[],
): Promise<boolean> {
  if (!opts.ask) return true;
  if (!canAsk(ctx.run)) {
    if (canPrintInfo(ctx.run)) {
      logger.info('fill: --ask ignored (not an interactive terminal).', ctx.run);
    }
    return true;
  }
  if (getCliYesFlag()) return true;
  const ok = await confirm({
    message: `Fill ${String(targets.length)} locale(s): ${targets.join(', ')}?`,
    default: false,
  });
  return ok;
}
