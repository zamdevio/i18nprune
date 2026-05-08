/**
 * Dotted key paths that must always be copied verbatim from the **source** locale during merge/sync
 * (and are respected by **`fill`** when **`respectPreserve`** is on).
 */
export type PreservePolicy = {
  /** Exact dotted keys to preserve (e.g. **`brand.tagline`**). */
  copyKeys?: string[];
  /** Any key whose path starts with one of these prefixes is preserved. */
  copyPrefixes?: string[];
};
