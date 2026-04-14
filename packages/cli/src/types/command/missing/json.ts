/**
 * Payload shape for `i18nprune missing --json`.
 * Additive fields may appear in future versions.
 */
export type MissingJsonOutput = {
  kind: 'missing';
  targetPath: string;
  targetKind: 'source' | 'locale';
  pathsAdded: number;
  paths: string[];
  dryRun: boolean;
  skippedNotInScan: string[];
};
