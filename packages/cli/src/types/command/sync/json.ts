import type { SyncFileLine } from '@/types/command/sync/summary.js';

/**
 * Payload shape for `i18nprune sync --json`.
 * Additive fields may appear in future versions.
 */
export type SyncJsonOutput = {
  kind: 'sync';
  sourcePath: string;
  localesDir: string;
  targetFiles: number;
  writtenFiles: number;
  dynamicKeySites: number;
  dryRun: boolean;
  files: SyncFileLine[];
};
