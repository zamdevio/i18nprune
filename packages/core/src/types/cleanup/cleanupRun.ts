import type { DynamicKeySite } from '../extractor/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { StringLeaf } from '../json/index.js';
import type { ProjectLiteralKeyUsage } from '../../extractor/projectLiteralKeyUsage.js';
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
  /** Report only; do not write. */
  checkOnly?: boolean;
  /** Alias for report-only behavior in SDK/CLI callers. */
  dryRun?: boolean;
  /** Skip string-presence safety probes supplied by the host. */
  skipStringPresenceCheck?: boolean;
};

export type CleanupReferenceData = {
  usage: ProjectLiteralKeyUsage;
  dynamicSites: readonly DynamicKeySite[];
};

export type CleanupHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  loadReferenceData: () => CleanupReferenceData;
  isStringPresenceAvailable: () => boolean;
  hasStringPresence: (sample: string) => boolean;
  getStringPresenceLocations: (sample: string, maxHits: number) => string[];
};

export type CleanupWritePlan = {
  sourcePath: string;
  keys: string[];
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
  stringPresenceAvailable: boolean;
  stringPresenceEvidence: CleanupStringPresenceEvidence[];
};
