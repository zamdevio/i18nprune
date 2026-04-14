/**
 * Aggregated key-path evidence from keySites + dynamic scans for policy-driven commands.
 */
export type KeyReferenceContext = {
  /** Literal + template_resolved keys (after optional per-file comment filtering in orchestrate). */
  provenKeys: ReadonlySet<string>;
  /**
   * Dotted key path prefixes that may cover runtime-only suffixes (`${…}`, partial templates).
   */
  uncertainPrefixes: string[];
};
