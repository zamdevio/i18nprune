/**
 * Types for the **quality** domain (source-identical / parity-adjacent reporting).
 */
import type { Issue } from '../json/envelope/index.js';
import type { StringLeaf } from '../json/stringLeaf/index.js';
import type { ParityPolicy } from '../policies/index.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { LocaleSuggestion } from '../suggestions/index.js';

/** Payload for the `quality` operation JSON envelope (`data` field). */
export type QualityJsonData = {
  total: number;
  perFile: Record<string, number>;
  dynamicKeySites: number;
  sourceLocale: string;
  localesDir: string;
  localeCount: number;
  targetLocaleCount: number;
  files: QualityFileLine[];
  suggestions?: LocaleSuggestion[];
};

export type QualityFileLine = {
  code: string;
  /** Primary segment report key (`fr.json`, `app/fr.json`, …). */
  file: string;
  segmentCount: number;
  segmentRelativePaths: string[];
  leafCount: number;
  isSourceLocale: boolean;
  sourceIdenticalLeafCount: number | null;
};

export type ComputeEnglishIdenticalCountsInput = {
  /** Source locale string leaves (paths and values). */
  sourceLeaves: readonly StringLeaf[];
  /**
   * One entry per target locale file (basename e.g. `ja.json` and leaves from that file).
   * Order matches CLI iteration over filtered locale files.
   */
  targets: ReadonlyArray<{
    fileBasename: string;
    leaves: readonly StringLeaf[];
  }>;
  /** Same semantics as CLI `config.policies.parity`. */
  parity?: ParityPolicy;
};

export type QualityRunOptions = {
  /** Report only this locale file (basename without .json); omit for all non-source locales. */
  target?: string;
};

export type QualityHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  /** Max locale rows in human output (from CLI list window). */
  listLimit?: number;
};

export type QualityRunResult = {
  payload: QualityJsonData;
  issues: Issue[];
  keyObservationsCount: number;
};
