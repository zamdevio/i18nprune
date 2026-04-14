import type { TargetProgressSummary } from '@/types/core/progress/index.js';

/** One row in `GenerateJsonPayload.targetResults`. */
export type GenerateTargetJsonRow = {
  target: string;
  status: 'written' | 'dry_run' | 'skipped_user_declined';
  progress?: TargetProgressSummary;
  /** Source string leaf count for this target session (same as source JSON). */
  sourceLeafCount?: number;
  preserveCount?: number;
  paritySkip?: number;
  paths?: { localeJson: string; metaJson: string | null };
};

/** Payload inside `CliJsonEnvelope<'generate', …>`. */
export type GenerateJsonPayload = {
  kind: 'generate';
  dryRun: boolean;
  force: boolean;
  targets: string[];
  dynamicKeySites: number;
  /** Sum of `sourceLeafCount` for targets that were written or dry-run (not user-skipped). */
  leavesProcessed: number;
  targetResults: GenerateTargetJsonRow[];
};
