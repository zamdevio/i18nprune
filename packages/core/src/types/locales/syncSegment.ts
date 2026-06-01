import type { TranslationSurfaceLeaf } from './leaves/translationSurface.js';

export type SyncSegmentSourcePlan = {
  sourceRelativePath: string;
  sourceAbsolutePath: string;
  sourceRaw: unknown;
  effectiveSourceLeaves: TranslationSurfaceLeaf[];
  template: unknown;
  sourceMap: Map<string, string>;
};
