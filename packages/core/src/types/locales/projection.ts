import type { TranslationSurfaceLeaf } from './leaves/translationSurface.js';

export type LocaleLeafProjection = {
  /**
   * Leaf map keyed by canonical dotted paths (e.g. `routes.index.title`).
   * When both dotted and nested representations exist for the same logical path,
   * the nested representation wins.
   */
  byPath: Map<string, TranslationSurfaceLeaf>;
  /** True when at least one object key contained a `.` segment. */
  sawDottedKey: boolean;
  /** Count of leaf conflicts where nested beat dotted. */
  conflicts: number;
};
