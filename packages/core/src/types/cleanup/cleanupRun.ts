import type { DynamicKeySite } from '../extractor/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { StringLeaf } from '../json/index.js';
import type { CleanupStringPresenceEvidence } from '../../cleanup/stringPresence.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { LocaleSuggestion } from '../suggestions/index.js';

export type CleanupJsonRunSummary = {
  durationMs: number;
  command: 'cleanup';
  ok: boolean;
  counts: { remove: number; dynamic: number };
};

export type CleanupJsonTargetEntry = {
  localeCode: string;
  wouldRemove: number;
  keys: string[];
  segmentPaths?: string[];
};

export type CleanupSkippedTarget = {
  localeCode: string;
  reason: 'not_found' | 'source_locale';
  suggestions?: string[];
};

export type CleanupJsonOutput = {
  wouldRemove: number;
  keys: string[];
  dynamic: number;
  dynamicActive: number;
  dynamicCommented: number;
  uncertainPrefixes: string[];
  /** Single target locale when `--target` resolves to one code. */
  targetLocale?: string;
  /** All target locale codes when `--target` lists multiple codes or `all`. */
  targetLocales?: string[];
  /** Per-target results when multiple locales are pruned in one run. */
  targets?: CleanupJsonTargetEntry[];
  skippedTargets?: CleanupSkippedTarget[];
  /** Present when the CLI emits the final `cleanup` envelope. */
  summary?: CleanupJsonRunSummary;
  /** Cross-op next-step hints (additive). */
  suggestions?: LocaleSuggestion[];
};

export type CleanupRunOptions = {
  /** Report candidates only; do not write (CLI `--dry-run`). */
  dryRun?: boolean;
  /** Skip host string-presence (ripgrep) probes — static unused-key list only. */
  skipStringPresenceCheck?: boolean;
  /** Target locale code(s) to prune: one code, comma-separated list, or `all`. Omit for source-locale cleanup. */
  target?: string;
  /** Max `--rg` string-presence skip lines in human output; default from global `--top`. Does not list all candidate paths. */
  top?: number;
  /** List every `--rg` string-presence skip line (global `--full`). */
  full?: boolean;
};

export type CleanupHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  /** Max string-presence evidence rows (from CLI list window). */
  listLimit?: number;
  listFull?: boolean;
  isStringPresenceAvailable: () => boolean;
  hasStringPresence: (sample: string) => boolean;
  getStringPresenceLocations: (sample: string, maxHits: number) => string[];
  /**
   * When false, core skips the string-presence guard for this key (CLI default; pass `--rg` to enable probes).
   * Default: apply guard per {@link reference.stringPresence} when probes are enabled.
   */
  shouldRunStringPresenceForKey?: (input: { key: string; value: string }) => boolean;
};

export type CleanupSegmentWrite = {
  sourcePath: string;
  relativePath: string;
  nextSourceJson: unknown;
  removedPaths: string[];
};

export type CleanupWritePlan = {
  /** Segment file writes (one for flat_file, many for locale_directory layouts). */
  writes: CleanupSegmentWrite[];
  keys: string[];
  /** Primary path for legacy messages (first write). */
  sourcePath: string;
  nextSourceJson: unknown;
  removedPaths: string[];
};

export type CleanupLocaleSlice = {
  localeCode: string;
  isTargetMode: boolean;
  writePlan: CleanupWritePlan;
  sourceLeaves: StringLeaf[];
  allKeyPathCount: number;
  candidateKeys: string[];
  safeToRemove: string[];
  excludedUncertain: number;
  stringPresenceEvidence: CleanupStringPresenceEvidence[];
  segmentPaths: string[];
};

export type CleanupRunResult = {
  payload: CleanupJsonOutput;
  issues: Issue[];
  /** One entry per locale processed (source or each `--target` code). */
  localeSlices: CleanupLocaleSlice[];
  writePlan: CleanupWritePlan;
  sourceLeaves: StringLeaf[];
  allKeyPathCount: number;
  candidateKeys: string[];
  safeToRemove: string[];
  excludedUncertain: number;
  dynamic: readonly DynamicKeySite[];
  keyObservationsCount: number;
  stringPresenceAvailable: boolean;
  stringPresenceEvidence: CleanupStringPresenceEvidence[];
  /** Primary locale label for legacy callers (first slice). */
  localeCode: string;
  isTargetMode: boolean;
  isMultiTarget: boolean;
  targetLocaleCodes: string[];
  skippedTargets: CleanupSkippedTarget[];
};
