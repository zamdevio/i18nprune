import {
  applyLocaleLeafNormalization,
  resolveLocaleLeafMode,
  type ResolveLocaleLeafModeInput,
} from '../shared/localeLeaves/index.js';
import { collectTranslationSurfaceLeaves } from '../shared/localeLeaves/index.js';
import { buildTranslatedLocaleFromSourceLeaves } from './localeTranslate.js';
import { ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES } from '../shared/constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../shared/docs/issueAnchors.js';
import type { LocaleMetadataReport } from '../types/localeLeaves/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { ParityPolicy, PreservePolicy } from '../types/policies/index.js';
import type { StringLeaf } from '../types/json/index.js';
import type { Translator } from '../types/translator/index.js';
import type { TranslationProviderId } from '../types/translator/providers.js';
import type { TranslationTickProgressFn } from '../types/progress/index.js';
import type { TranslateStartRateLimit } from '../types/translator/rateLimit.js';
import type { TranslateRunPartialStats } from '../types/translator/runStats.js';

/**
 * Generate: translate source leaves into a working locale object, then apply structured-metadata /
 * legacy normalization (same ordering as CLI `executeGenerate`).
 */
export async function translateAndNormalizeGenerateLocale(input: {
  sourceLeaves: readonly StringLeaf[];
  working: unknown;
  existingRaw: unknown | null;
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
  dryRun: boolean;
  force: boolean;
  provider: Translator;
  providerId: TranslationProviderId;
  targetLang: string;
  sourceMap: Map<string, string>;
  tickProgress: TranslationTickProgressFn;
  onTranslatedLeaf?: (sourceText: string, translatedText: string, path: string) => Promise<void> | void;
  localeLeafResolve: ResolveLocaleLeafModeInput;
  /** Max in-flight **`translateLeaf`** calls during generate (default **1**). */
  maxParallelTranslates?: number;
  /** Optional translate request pacing limits (rpm/rps/intervalMs). */
  rateLimit?: TranslateStartRateLimit;
}): Promise<{
  preserveCount: number;
  paritySkip: number;
  /** Leaves whose source string value was whitespace-only (**`dryRun`** counts them too). */
  emptySourceLeafCount: number;
  next: unknown;
  report: LocaleMetadataReport;
  modeDecision: ReturnType<typeof resolveLocaleLeafMode>;
  issues: Issue[];
  translateStats: {
    requestAttempts: number;
    retriesMade: number;
    successfulLeaves: number;
    failedRequests: number;
  };
  markedForReview: number;
}> {
  const modeDecision = resolveLocaleLeafMode(input.localeLeafResolve);
  const built = await buildTranslatedLocaleFromSourceLeaves({
    sourceLeaves: input.sourceLeaves,
    working: input.working,
    existingRaw: input.existingRaw,
    preserve: input.preserve,
    parity: input.parity,
    dryRun: input.dryRun,
    force: input.force,
    provider: input.provider,
    persistStructuredLeafMetadata: modeDecision.mode === 'structured',
    providerId: input.providerId,
    targetLang: input.targetLang,
    tickProgress: input.tickProgress,
    onTranslatedLeaf: input.onTranslatedLeaf,
    maxParallelTranslates: input.maxParallelTranslates,
    rateLimit: input.rateLimit,
  });
  const norm = applyLocaleLeafNormalization({
    localeJson: built.working,
    sourceMap: input.sourceMap,
    resolveInput: input.localeLeafResolve,
  });

  const issues: Issue[] = [];
  const emptyPaths = built.emptySourceLeafPaths;
  if (emptyPaths.length > 0) {
    const n = emptyPaths.length;
    const sample = emptyPaths.slice(0, 8).join(', ');
    const tail = n > 8 ? ` (+${String(n - 8)} more)` : '';
    const metaHint =
      modeDecision.mode === 'structured'
        ? ' Use `i18nprune sync --metadata` when your project persists structured locale leaves.'
        : ' Use `i18nprune sync` (add `--metadata` if your project persists structured locale leaves).';
    issues.push({
      severity: 'warning',
      code: ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES,
      message: `Source locale has ${String(n)} string leaf value(s) that are empty or whitespace-only — they were copied without calling the translator.${metaHint} Sample paths: ${sample}${tail}`,
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES),
    });
  }

  return {
    preserveCount: built.preserveCount,
    paritySkip: built.paritySkip,
    emptySourceLeafCount: emptyPaths.length,
    next: norm.next,
    report: norm.report,
    modeDecision: norm.modeDecision,
    issues,
    translateStats: built.translateStats,
    markedForReview: built.markedForReview,
  };
}

/**
 * After a failed generate attempt, normalize **`working`** (already a partial locale object, e.g. from
 * {@link TranslateRunInterruptedError}) the same way a successful pass ends: locale-leaf metadata
 * rules + empty-source warnings + **`needsReview`** counts for **`--json`** / host summaries.
 */
export function finalizePartialTranslatedLocaleForGenerate(input: {
  sourceLeaves: readonly StringLeaf[];
  working: unknown;
  sourceMap: Map<string, string>;
  localeLeafResolve: ResolveLocaleLeafModeInput;
  translateStats: TranslateRunPartialStats;
}): {
  preserveCount: number;
  paritySkip: number;
  emptySourceLeafCount: number;
  next: unknown;
  report: LocaleMetadataReport;
  modeDecision: ReturnType<typeof resolveLocaleLeafMode>;
  issues: Issue[];
  translateStats: TranslateRunPartialStats;
  markedForReview: number;
} {
  const norm = applyLocaleLeafNormalization({
    localeJson: input.working,
    sourceMap: input.sourceMap,
    resolveInput: input.localeLeafResolve,
  });
  const modeDecision = norm.modeDecision;

  const issues: Issue[] = [];
  const emptyPaths = input.sourceLeaves.filter((l) => l.value.trim() === '').map((l) => l.path);
  if (emptyPaths.length > 0) {
    const n = emptyPaths.length;
    const sample = emptyPaths.slice(0, 8).join(', ');
    const tail = n > 8 ? ` (+${String(n - 8)} more)` : '';
    const metaHint =
      modeDecision.mode === 'structured'
        ? ' Use `i18nprune sync --metadata` when your project persists structured locale leaves.'
        : ' Use `i18nprune sync` (add `--metadata` if your project persists structured locale leaves).';
    issues.push({
      severity: 'warning',
      code: ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES,
      message: `Source locale has ${String(n)} string leaf value(s) that are empty or whitespace-only — they were copied without calling the translator.${metaHint} Sample paths: ${sample}${tail}`,
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES),
    });
  }

  const markedForReview = collectTranslationSurfaceLeaves(norm.next).filter((r) => r.needsReview === true).length;

  return {
    preserveCount: 0,
    paritySkip: 0,
    emptySourceLeafCount: emptyPaths.length,
    next: norm.next,
    report: norm.report,
    modeDecision: norm.modeDecision,
    issues,
    translateStats: input.translateStats,
    markedForReview,
  };
}
