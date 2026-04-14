export type { MissingJsonOutput } from '@/types/command/missing/json.js';

/** Flags for `i18nprune missing` (scaffold keys into locale JSON). */
export type MissingOptions = {
  /** Locale basename under `localesDir` (omit = source locale file). */
  locale?: string;
  dryRun?: boolean;
  /** Path to `validate --json` output; uses its `missing` array (filtered to current scan). */
  fromReport?: string;
  /** Max paths to show in human listings; default 10. Ignored when `fullList` is true. */
  top?: number;
  /** Human output lists every path (overrides `top`). `--json` still emits full `paths`. */
  fullList?: boolean;
};
