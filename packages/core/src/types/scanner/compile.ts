/**
 * Precomputed scan-exclusion rules for {@link listSourceFiles} / {@link compileScanExclude}
 * in **`shared/scanner/files.ts`** (built once per walk; hot path uses **`Set`** + small arrays).
 */
export type CompiledScanExclude = {
  defaultDirs: ReadonlySet<string> | null;
  dirStrings: Set<string>;
  dirRegexes: RegExp[];
  fileStrings: Set<string>;
  fileRegexes: RegExp[];
  extStrings: Set<string>;
  extRegexes: RegExp[];
  pathPatterns: RegExp[];
  userRulesEmpty: boolean;
};
