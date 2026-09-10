/**
 * Dotted key paths that must always be copied verbatim from the **source** locale during merge/sync
 * (and are respected by **`generate --resume`** when **`respectPreserve`** is on).
 */
export type PreservePolicy = {
  /** Exact dotted keys to preserve (e.g. **`brand.tagline`**). */
  copyKeys?: string[];
  /** Any key whose path starts with one of these prefixes is preserved (verbatim / skip MT). */
  copyPrefixes?: string[];
  /**
   * Declared uncertain roots (no scan-anchor file). Sync retains/hydrates like auto uncertain
   * prefixes; cleanup/generate protect paths follow `uncertainKeyPolicy` when merged into the
   * reference context keep list.
   */
  uncertainPrefixes?: string[];
};
