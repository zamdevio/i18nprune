import type { TargetProgressSummary } from '@/types/core/progress/index.js';

export type FillTargetJsonRow = {
  target: string;
  status: 'written' | 'dry_run';
  updated: number;
  paths: { localeJson: string; metaJson: string | null };
  progress: TargetProgressSummary;
};

/** Payload inside `CliJsonEnvelope<'fill', …>`. */
export type FillJsonPayload = {
  kind: 'fill';
  dryRun: boolean;
  /** When set, meta sidecars were skipped (`--no-meta`). */
  noMeta?: boolean;
  targets: string[];
  /** Total string leaves updated across targets. */
  updated: number;
  sourceLeaves: number;
  dynamicKeySites: number;
  targetResults: FillTargetJsonRow[];
};
