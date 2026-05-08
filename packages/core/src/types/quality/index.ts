/**
 * Types for the **quality** domain (source-identical / parity-adjacent reporting).
 * CLI-only option types live under the CLI package (`types/command/quality`); this barrel is envelope / programmatic shapes for `@i18nprune/core`.
 */
import type { StringLeaf } from '../json/stringLeaf/index.js';
import type { ParityPolicy } from '../policies/index.js';

/** Payload for the `quality` operation JSON envelope (`data` field). */
export type QualityJsonData = {
  total: number;
  perFile: Record<string, number>;
  dynamicKeySites: number;
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
