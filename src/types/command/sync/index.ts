export type SyncOptions = {
  /** Report only; do not write locale files */
  dryRun?: boolean;
  /** Comma-separated locale basenames, or **`all`** (default: all non-source locales). */
  lang?: string;
};
