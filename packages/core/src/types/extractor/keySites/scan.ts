export type ScanKeyObservationsOptions = {
  /** When set, skip calls whose start offset lies inside these comment ranges (line/block). */
  commentRanges?: Array<{ start: number; end: number }>;
};
