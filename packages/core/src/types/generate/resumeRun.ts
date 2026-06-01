/**
 * Types for **`generate --resume`** per-target orchestration (`runGenerateResumeLocale`).
 */
import type { CoreContext } from '../context/index.js';
import type { TranslationSurfaceLeaf } from '../locales/leaves/translationSurface.js';
import type { LocaleSegmentWritePlan } from '../locales/segmentWritePlan.js';
import type { EffectiveReferenceConfig } from '../reference/index.js';
import type { GenerateTranslateCache } from '../translator/cache.js';
import type { GenerateHostHooks, GenerateRunOptions } from './generateRun.js';
import type { GenerateResumeRefContext } from './resumeCandidates.js';

/** Host + context bundle for one target in **`generate --resume`**. */
export type RunGenerateResumeLocaleInput = {
  ctx: CoreContext;
  opts: GenerateRunOptions;
  host: GenerateHostHooks;
  target: string;
  sourceMap: Map<string, string>;
  sourceLeaves: readonly TranslationSurfaceLeaf[];
  eff: EffectiveReferenceConfig;
  refCtx: GenerateResumeRefContext;
  targetPath: string;
  writePlan: LocaleSegmentWritePlan;
  targetStarted: number;
  translationCache?: GenerateTranslateCache;
};
