import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';

export type MissingTargetKind = 'source' | 'locale';

/**
 * Payload shape for `i18nprune missing --json`.
 * Additive fields may appear in future versions.
 */
export type MissingJsonOutput = {
  kind: 'missing';
  targetPath: string;
  targetKind: MissingTargetKind;
  pathsAdded: number;
  paths: string[];
  dryRun: boolean;
  skippedNotInScan: string[];
  targets: MissingJsonTarget[];
  skippedTargets: MissingSkippedTarget[];
};

export type MissingRunOptions = {
  /** Locale basename(s) under `localesDir`, or `all`; omit = source locale file. */
  target?: string;
  dryRun?: boolean;
};

export type MissingTargetState = {
  targetPath: string;
  targetKind: MissingTargetKind;
  localeJson: unknown;
  selectedLocaleCode?: string;
};

export type MissingSkippedTarget = {
  localeCode: string;
  targetPath: string;
  reason: 'not_found' | 'source_locale';
  suggestions?: string[];
};

export type MissingTargetPlan = {
  target: MissingTargetState;
  toAdd: string[];
  skippedNotInScan: string[];
};

export type MissingJsonTarget = {
  targetPath: string;
  targetKind: MissingTargetKind;
  selectedLocaleCode?: string;
  pathsAdded: number;
  paths: string[];
  skippedNotInScan: string[];
};

export type MissingHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  /** All resolved literal/template-resolved keys from the current project scan. */
  loadResolvedKeys: () => ReadonlySet<string>;
  /** Dynamic translation call-site count used for JSON/human warnings. */
  getDynamicSitesCount: () => number;
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
};

export type MissingWriteInput = {
  targetPath: string;
  localeJson: unknown;
  paths: readonly string[];
  placeholder: string;
};
