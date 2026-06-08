/**
 * Folded summary of key-site observations for usage detection (`cleanup`, `missing`, reference rules).
 * Built with per-file const maps (avoids cross-file `const` identifier collisions).
 */
export type ProjectLiteralKeyUsage = {
  /** Fully resolved `literal` and `template_resolved` keys. */
  resolvedKeys: ReadonlySet<string>;
  /** Static prefixes from unlinked `template_partial` observations (`dynamicRef` unset). Linked partials defer to dynamic scan. */
  uncertainPrefixes: ReadonlySet<string>;
  /** First path segment (or bracket segment) of each resolved or uncertain path — prefix matching for “used under root”. */
  usedRoots: ReadonlySet<string>;
};
