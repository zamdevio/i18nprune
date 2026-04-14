export type ProgressCallbacks = {
  onUpdate?: (line: string) => void;
  onComplete?: () => void;
  onError?: () => void;
};

export type TranslationProgress = {
  readonly quiet: boolean;
  tick(current: number, total: number, label: string): void;
  done(): void;
  fail(): void;
};

export type SessionProgressOptions = {
  quiet?: boolean;
  json?: boolean;
};

/**
 * Shared per-target execution counters used by `generate`, `fill`, and future patching flows.
 * Keep this shape stable so commands can share one JSON contract.
 */
export type TargetProgressSummary = {
  sourceLeafCount?: number;
  processedLeafCount?: number;
  translatedLeafCount?: number;
  updatedLeafCount?: number;
  preserveCount?: number;
  paritySkipCount?: number;
  forced?: boolean;
  durationMs?: number;
};
