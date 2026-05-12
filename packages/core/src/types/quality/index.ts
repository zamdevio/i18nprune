/**
 * Types for the **quality** domain (source-identical / parity-adjacent reporting).
 */
import type { Issue } from '../json/envelope/index.js';
import type { StringLeaf } from '../json/stringLeaf/index.js';
import type { ParityPolicy } from '../policies/index.js';
import type { RunEmitter } from '../shared/run/index.js';

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
};

export type QualityFileLine = {
  code: string;
  file: string;
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
  /** Dynamic translation call-site count used for JSON/human warnings. */
  getDynamicSitesCount: () => number;
};

export type QualityRunResult = {
  payload: QualityJsonData;
  issues: Issue[];
};
