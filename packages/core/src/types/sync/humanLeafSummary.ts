/** Counts for human sync logging (**merge + prune** vs source template only). */
export type SyncHumanLeafSummary = {
  /** Source paths that had no existing leaf in the target before sync. */
  hydratedFromSource: number;
  /** Source paths that already had a readable leaf before merge+prune. */
  preservedExistingLeaves: number;
  /** Previously present string-leaf dotted paths outside the template (removed to match source shape). */
  prunedExtraLeaves: number;
};
