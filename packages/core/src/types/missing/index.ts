export type ResolveMissingPathsPlanInput = {
  /** Target locale JSON object used to detect already-existing string leaves. */
  localeJson?: unknown;
  /** Merged leaves for multi-segment locales (preferred over `localeJson` when set). */
  localeLeaves?: ReadonlyArray<{ path: string }>;
  /** All resolved literal keys seen in the current project scan. */
  resolvedKeys: ReadonlySet<string>;
  /** Optional `missing` entries from a prior validate JSON report. */
  reportMissingPaths?: readonly string[];
};

export type {
  MissingHostHooks,
  MissingJsonTarget,
  MissingJsonOutput,
  MissingPlaceholderLeaf,
  MissingPlaceholderLeafList,
  MissingRunOptions,
  MissingRunResult,
  MissingSkippedTarget,
  MissingTargetKind,
  MissingSegmentWrite,
  MissingTargetPlan,
  MissingTargetState,
  MissingWriteInput,
} from './missingRun.js';
