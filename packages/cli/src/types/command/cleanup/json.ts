/**
 * Payload shape for `i18nprune cleanup --json` (check-only / no-write mode).
 * Additive fields may appear in future versions.
 */
/** Timing + counts for `cleanup --json` (embedded in the primary envelope; no second stdout line). */
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
  /** Present when the CLI emits the final `cleanup` envelope (stdout includes timing that used to be a separate `kind: summary` line). */
  summary?: CleanupJsonRunSummary;
};
