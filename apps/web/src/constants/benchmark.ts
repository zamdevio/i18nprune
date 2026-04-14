/**
 * Benchmark page case study: numbers from a real large app (`CepatEdge` `apps/web`) used for screenshots and
 * `time` captures. Update when you re-run `tree` / `validate --json` on that tree.
 *
 * Tree: `tree -I 'node_modules|dist|.next|out'` → dirs + files below.
 * Validate: one `validate --json` on that tree — literal key observations (`data.count`), dynamic call sites
 * (`data.dynamic.count`); wall times in screenshots were sub-second.
 */
export const BENCHMARK_CASE_STUDY = {
  app: "CepatEdge web",
  path: "~/Projects/CepatEdge/apps/web",
  treeDirs: 135,
  treeFiles: 352,
  treeIgnore: "node_modules|dist|.next|out",
  literalKeyObservations: 1177,
  dynamicSites: 88,
} as const;
