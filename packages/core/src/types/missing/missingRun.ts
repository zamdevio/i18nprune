import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { LocaleSuggestion } from '../suggestions/index.js';

export type MissingTargetKind = 'source' | 'locale';

/**
 * Payload shape for `i18nprune missing --json`.
 * Additive fields may appear in future versions.
 */
export type MissingJsonOutput = {
  kind: 'missing';
  targetPath: string;
  targetPaths?: string[];
  targetKind: MissingTargetKind;
  pathsAdded: number;
  shown: number;
  top: number | null;
  full: boolean;
  paths: string[];
  dryRun: boolean;
  skippedNotInScan: string[];
  targets: MissingJsonTarget[];
  skippedTargets: MissingSkippedTarget[];
  placeholderLeaves: MissingPlaceholderLeafList;
  /** Cross-op next-step hints (additive). */
  suggestions?: LocaleSuggestion[];
};

export type MissingRunOptions = {
  /** Locale basename(s) under `localesDir`, or `all`; omit = source locale file. */
  target?: string;
  dryRun?: boolean;
  /** Max placeholder leaves to include in JSON listings; default 10. Ignored when `full` is true. */
  top?: number;
  /** JSON listings include every placeholder leaf (overrides `top`). */
  full?: boolean;
};

export type MissingTargetState = {
  targetPath: string;
  targetKind: MissingTargetKind;
  localeJson: unknown;
  localeText: string;
  selectedLocaleCode?: string;
  selectedLocaleEnglishName?: string;
  targetDisplayPath?: string;
};

export type MissingSkippedTarget = {
  localeCode: string;
  targetPath: string;
  reason: 'not_found' | 'source_locale';
  suggestions?: string[];
};

export type MissingSegmentWrite = {
  targetPath: string;
  relativePath: string;
  paths: string[];
};

export type MissingTargetPlan = {
  target: MissingTargetState;
  toAdd: string[];
  skippedNotInScan: string[];
  /** Per-segment file writes (multi-segment layouts). */
  writePlan: MissingSegmentWrite[];
};

export type MissingJsonTarget = {
  targetPath: string;
  targetPaths?: string[];
  targetKind: MissingTargetKind;
  selectedLocaleCode?: string;
  pathsAdded: number;
  paths: string[];
  skippedNotInScan: string[];
};

export type MissingPlaceholderLeaf = {
  localeRole: MissingTargetKind;
  localeCode: string;
  file: string;
  path: string;
  value: string;
  line: number | null;
  location: string;
};

export type MissingPlaceholderLeafList = {
  count: number;
  shown: number;
  top: number | null;
  full: boolean;
  leaves: MissingPlaceholderLeaf[];
};

export type MissingHostHooks = {
  emit?: RunEmitter;
  runId?: string;
};

export type MissingRunResult = {
  payload: MissingJsonOutput;
  issues: Issue[];
  targets: MissingTargetPlan[];
  skippedTargets: MissingSkippedTarget[];
  /** Aggregate across planned targets, preserved for simple callers. */
  toAdd: string[];
  skippedNotInScan: string[];
  dynamicSites: number;
  keyObservationsCount: number;
  placeholderLeaves: MissingPlaceholderLeaf[];
};

export type MissingWriteInput = {
  targetPath: string;
  localeJson: unknown;
  localeCode?: string;
  paths: readonly string[];
  placeholder: string;
  writePlan?: MissingSegmentWrite[];
};
