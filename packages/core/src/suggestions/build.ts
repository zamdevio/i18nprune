import { listCleanupSourceSegmentsForKeys } from '../cleanup/sourceSurface.js';
import { listTargetSegmentPathsForKeys } from './computeExtraTargetKeys.js';
import { sourceLocaleCodeFromContext } from '../shared/locales/targets/index.js';
import type { ProjectAnalysis } from '../types/analysis/index.js';
import type { CoreContext } from '../types/context/index.js';
import type { OperationId } from '../types/shared/run/index.js';
import type { LocaleSuggestion } from '../types/suggestions/index.js';
import { computeExtraTargetKeysForTargets } from './computeExtraTargetKeys.js';
import { computeUnusedSourceKeys } from './computeUnusedSourceKeys.js';

export type BuildLocaleSuggestionsInput = {
  op: OperationId;
  ctx: CoreContext;
  analysis: ProjectAnalysis;
  /** Literal key paths missing from the source locale (validate). */
  missingKeyPaths?: readonly string[];
  /** Paths added during a missing run. */
  pathsAdded?: number;
  /** Skipped missing targets with typo hints. */
  skippedTargets?: readonly { localeCode: string; suggestions?: readonly string[] }[];
  /** Target locales in scope (quality/review `--target`); defaults to all non-source codes. */
  targetLocaleCodes?: readonly string[];
  /** Source-identical leaf count (quality/review). */
  sourceIdenticalCount?: number;
  dryRun?: boolean;
  /** Target locale for an in-flight cleanup run (`--target`). */
  cleanupTarget?: string;
  /** Keys that would be removed in the current cleanup dry-run. */
  cleanupRemoveCount?: number;
  cleanupRemoveKeys?: readonly string[];
};

const TARGET_EXTRA_OPS = new Set<OperationId>([
  'validate',
  'missing',
  'sync',
  'generate',
  'quality',
  'review',
]);

function sourceSegmentPaths(ctx: CoreContext, keys: readonly string[]): string[] {
  return listCleanupSourceSegmentsForKeys(ctx, keys).map((s) => s.relativePath.replace(/\\/g, '/'));
}

function targetSegmentPaths(ctx: CoreContext, localeCode: string, keys: readonly string[]): string[] {
  return listTargetSegmentPathsForKeys(ctx, localeCode, keys);
}

function cleanupDryRunCommand(targetCode?: string): string {
  return targetCode ? `i18nprune cleanup --target ${targetCode} --dry-run` : 'i18nprune cleanup --dry-run';
}

function cleanupConfirmCommands(targetCode?: string): string[] {
  const base = targetCode ? `i18nprune cleanup --target ${targetCode}` : 'i18nprune cleanup';
  return [`${base} --yes`, `${base} --ask`];
}

function buildSourceUnusedSuggestion(
  ctx: CoreContext,
  input: BuildLocaleSuggestionsInput,
  unusedKeys: readonly string[],
  unusedCount: number,
): LocaleSuggestion {
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const segmentPaths = sourceSegmentPaths(ctx, unusedKeys);
  const generateNote =
    input.op === 'generate' || input.op === 'sync'
      ? '; generate only translates keys referenced in the current scan'
      : '';
  const commands = input.op === 'cleanup' ? [] : [cleanupDryRunCommand()];
  return {
    kind: 'run_cleanup_source',
    id: 'suggest.cleanup.source_unused',
    message: `Source locale (${sourceCode}) has ${String(unusedCount)} unused key(s) not referenced in the current code scan${generateNote}.`,
    commands,
    data: { localeCode: sourceCode, segmentPaths, unusedCount },
  };
}

function buildCleanupDryRunFollowupSuggestion(
  ctx: CoreContext,
  input: {
    localeCode: string;
    keys: readonly string[];
    count: number;
    targetMode: boolean;
  },
): LocaleSuggestion {
  const segmentPaths = input.targetMode
    ? targetSegmentPaths(ctx, input.localeCode, input.keys)
    : sourceSegmentPaths(ctx, input.keys);
  const roleLabel = input.targetMode ? 'Target' : 'Source';
  return {
    kind: input.targetMode ? 'run_cleanup_target' : 'run_cleanup_source',
    id: input.targetMode ? 'suggest.cleanup.target_unused' : 'suggest.cleanup.source_unused',
    message: `${roleLabel} locale (${input.localeCode}) — ${String(input.count)} path(s) would be removed after review.`,
    commands: cleanupConfirmCommands(input.targetMode ? input.localeCode : undefined),
    data: { localeCode: input.localeCode, segmentPaths, unusedCount: input.count },
  };
}

function buildTargetExtraSuggestion(
  ctx: CoreContext,
  localeCode: string,
  extraKeys: readonly string[],
  extraCount: number,
  input: BuildLocaleSuggestionsInput,
): LocaleSuggestion {
  const segmentPaths = targetSegmentPaths(ctx, localeCode, extraKeys);
  const commands =
    input.op === 'cleanup' && input.dryRun === true
      ? cleanupConfirmCommands(localeCode)
      : [cleanupDryRunCommand(localeCode)];
  return {
    kind: 'run_cleanup_target',
    id: 'suggest.cleanup.target_extra',
    message: `Target locale (${localeCode}) has ${String(extraCount)} extra key(s) not referenced in the current code scan.`,
    commands,
    data: { localeCode, segmentPaths, unusedCount: extraCount },
  };
}

/** Pure builder — returns suggestions without emitting. */
export function buildLocaleSuggestions(input: BuildLocaleSuggestionsInput): LocaleSuggestion[] {
  const suggestions: LocaleSuggestion[] = [];

  if (input.op === 'cleanup' && input.dryRun === true && (input.cleanupRemoveCount ?? 0) > 0) {
    suggestions.push(
      buildCleanupDryRunFollowupSuggestion(input.ctx, {
        localeCode: input.cleanupTarget ?? sourceLocaleCodeFromContext(input.ctx),
        keys: input.cleanupRemoveKeys ?? [],
        count: input.cleanupRemoveCount!,
        targetMode: input.cleanupTarget !== undefined,
      }),
    );
    return suggestions;
  }

  const { candidates, count: unusedCount } = computeUnusedSourceKeys(input.ctx, input.analysis);
  if (unusedCount > 0 && !(input.op === 'cleanup' && input.cleanupTarget)) {
    suggestions.push(buildSourceUnusedSuggestion(input.ctx, input, candidates, unusedCount));
  }

  if (TARGET_EXTRA_OPS.has(input.op)) {
    for (const extra of computeExtraTargetKeysForTargets(input.ctx, input.analysis, input.targetLocaleCodes)) {
      suggestions.push(
        buildTargetExtraSuggestion(input.ctx, extra.localeCode, extra.candidates, extra.count, input),
      );
    }
  }

  const missingCount = input.missingKeyPaths?.length ?? 0;
  if (missingCount > 0 && input.op === 'validate') {
    suggestions.push({
      kind: 'run_missing',
      id: 'suggest.missing.literal_keys',
      message: `${String(missingCount)} key path(s) in the code scan are missing from the source locale — add placeholders before sync or generate.`,
      commands: ['i18nprune missing'],
      data: { missingCount },
    });
  }

  if (input.op === 'missing' && (input.pathsAdded ?? 0) > 0 && input.dryRun !== true) {
    suggestions.push({
      kind: 'run_generate',
      id: 'suggest.generate.after_missing',
      message: `Added ${String(input.pathsAdded)} path(s) — translate target locales when ready.`,
      commands: ['i18nprune generate --target all'],
    });
  }

  const sourceIdenticalCount = input.sourceIdenticalCount ?? 0;
  if (sourceIdenticalCount > 0 && (input.op === 'quality' || input.op === 'review')) {
    suggestions.push({
      kind: 'run_generate',
      id: 'suggest.generate.source_identical',
      message: `${String(sourceIdenticalCount)} source-identical leaf value(s) match the source locale at the same path — refresh translations when ready.`,
      commands: ['i18nprune generate --resume', 'i18nprune generate'],
    });
  }

  for (const skipped of input.skippedTargets ?? []) {
    if (!skipped.suggestions?.length) continue;
    suggestions.push({
      kind: 'run_missing',
      id: 'suggest.missing.target_typo',
      message: `Unknown target "${skipped.localeCode}" — did you mean: ${skipped.suggestions.join(', ')}?`,
      commands: [],
      data: { localeCode: skipped.localeCode },
    });
  }

  return suggestions;
}
