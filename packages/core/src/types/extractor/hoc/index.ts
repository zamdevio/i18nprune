/**
 * Opt-in HOC / prop-helper expansion (extractor §B).
 * Off by default — unrelated props named `t` are a false-positive risk.
 */
export type ExtractorHocOptions = {
  /** When true, treat matching destructured props as translation helpers. Default false. */
  enabled?: boolean;
  /**
   * Prop names to promote when destructured in a function/arrow first parameter.
   * Default `['t']`. Renames (`{ t: translate }`) are out of scope for this slice.
   */
  propNames?: string[];
};
