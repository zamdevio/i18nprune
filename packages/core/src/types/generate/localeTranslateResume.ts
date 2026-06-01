import type { ParityPolicy, PreservePolicy } from '../policies/index.js';
import type { EffectiveReferenceConfig } from '../reference/index.js';
import type { TranslationSurfaceLeaf } from '../locales/leaves/translationSurface.js';
import type { GenerateResumeRefContext } from './resumeCandidates.js';

export type ResumeTranslationJob = { leafIndex: number; path: string; value: string };

export type ListResumeTranslationJobsInput = {
  tLeaves: readonly TranslationSurfaceLeaf[];
  next: unknown;
  sourceMap: Map<string, string>;
  refCtx: GenerateResumeRefContext;
  eff: EffectiveReferenceConfig;
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
  dryRun: boolean;
};
