import type { DynamicKeySite } from '../extractor/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { StringLeaf } from '../json/index.js';
import type { CleanupStringPresenceEvidence } from '../../cleanup/stringPresence.js';
import type { RunEmitter } from '../shared/run/index.js';

export type CleanupJsonRunSummary = {
  durationMs: number;
  command: 'cleanup';
  ok: boolean;
  counts: { remove: number; dynamicKeySites: number };
};

export type CleanupJsonOutput = {
  wouldRemove: number;
  keys: string[];
  dynamicKeySites: number;
  uncertainPrefixes: string[];
  /** Present when the CLI emits the final `cleanup` envelope. */
  summary?: CleanupJsonRunSummary;
};

export type CleanupRunOptions = {
  /** Report candidates only; do not write (CLI `--dry-run`). */
  dryRun?: boolean;
  /** Skip host string-presence (ripgrep) probes — static unused-key list only. */
  skipStringPresenceCheck?: boolean;
};

export type CleanupHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  isStringPresenceAvailable: () => boolean;
  hasStringPresence: (sample: string) => boolean;
  getStringPresenceLocations: (sample: string, maxHits: number) => string[];
  /**
   * When false, core skips the string-presence guard for this key (CLI sets false for all keys when `--no-rg`).
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

export type CleanupRunResult = {
  payload: CleanupJsonOutput;
  issues: Issue[];
  writePlan: CleanupWritePlan;
  sourceLeaves: StringLeaf[];
  allKeyPathCount: number;
  candidateKeys: string[];
  safeToRemove: string[];
  excludedUncertain: number;
  dynamicSites: readonly DynamicKeySite[];
  keyObservationsCount: number;
  stringPresenceAvailable: boolean;
  stringPresenceEvidence: CleanupStringPresenceEvidence[];
};
