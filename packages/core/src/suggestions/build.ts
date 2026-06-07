import { listCleanupSourceSegmentsForKeys } from '../cleanup/sourceSurface.js';
import { sourceLocaleCodeFromContext } from '../shared/locales/targets/index.js';
import type { ProjectAnalysis } from '../types/analysis/index.js';
import type { CoreContext } from '../types/context/index.js';
import type { OperationId } from '../types/shared/run/index.js';
import type { LocaleSuggestion } from '../types/suggestions/index.js';
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
  dryRun?: boolean;
};

function segmentPathHint(ctx: CoreContext, keys: readonly string[]): { segmentPaths: string[]; hint: string } {
  const segments = listCleanupSourceSegmentsForKeys(ctx, keys);
  const segmentPaths = segments.map((s) => s.relativePath.replace(/\\/g, '/'));
  if (segmentPaths.length === 0) return { segmentPaths, hint: '' };
  const shown = segmentPaths.slice(0, 3);
  const tail = segmentPaths.length > 3 ? ` (+${String(segmentPaths.length - 3)} more)` : '';
  return { segmentPaths, hint: ` — mostly in ${shown.join(', ')}${tail}` };
}

function buildSourceUnusedSuggestion(
  ctx: CoreContext,
  input: BuildLocaleSuggestionsInput,
  unusedKeys: readonly string[],
  unusedCount: number,
): LocaleSuggestion {
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const { segmentPaths, hint } = segmentPathHint(ctx, unusedKeys);
  const generateNote =
    input.op === 'generate' || input.op === 'sync'
      ? '; generate only translates keys referenced in the current scan'
      : '';
  let commands: string[];
  if (input.op === 'cleanup') {
    commands = input.dryRun === true ? ['i18nprune cleanup --apply'] : [];
  } else {
    commands = ['i18nprune cleanup --dry-run'];
  }
  return {
    kind: 'run_cleanup_source',
    id: 'suggest.cleanup.source_unused',
    message: `Source locale (${sourceCode}) has ${String(unusedCount)} unused key(s) not referenced in the current code scan${hint}${generateNote}.`,
    commands,
    data: { localeCode: sourceCode, segmentPaths, unusedCount },
  };
}

/** Pure builder — returns suggestions without emitting. */
export function buildLocaleSuggestions(input: BuildLocaleSuggestionsInput): LocaleSuggestion[] {
  const suggestions: LocaleSuggestion[] = [];
  const { candidates, count: unusedCount } = computeUnusedSourceKeys(input.ctx, input.analysis);

  if (unusedCount > 0) {
    suggestions.push(buildSourceUnusedSuggestion(input.ctx, input, candidates, unusedCount));
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
