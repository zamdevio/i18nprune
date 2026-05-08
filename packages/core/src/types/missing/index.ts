export type ResolveMissingPathsPlanInput = {
  /** Target locale JSON object used to detect already-existing string leaves. */
  localeJson: unknown;
  /** All resolved literal keys seen in the current project scan. */
  resolvedKeys: ReadonlySet<string>;
  /** Optional `missing` entries from a prior validate JSON report. */
  reportMissingPaths?: readonly string[];
};
