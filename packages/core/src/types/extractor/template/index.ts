import type { ConstSubstitutionStep } from '../keySites/index.js';

/** One `${…}` hole after classifying const-map substitution vs runtime. */
export type TemplateHole =
  | {
      kind: 'const_resolved';
      /** Raw interior of `${…}` without braces. */
      expr: string;
      identifier: string;
      value: string;
    }
  | {
      kind: 'runtime';
      expr: string;
    };

export type TemplateHolePartition = {
  holes: TemplateHole[];
  constResolved: Extract<TemplateHole, { kind: 'const_resolved' }>[];
  runtime: Extract<TemplateHole, { kind: 'runtime' }>[];
};

export type TemplateCallClassification =
  | 'fully_resolved'
  | 'mixed_const_runtime'
  | 'runtime_only';

/** Shared per-call template analysis for keySites and dynamic passes. */
export type TemplateCallAnalysis = {
  templateRaw: string;
  classification: TemplateCallClassification;
  partition: TemplateHolePartition;
  substitutions: ConstSubstitutionStep[];
  /** Fully resolved dotted key when `classification === 'fully_resolved'`. */
  resolvedKey: string | null;
  /**
   * Longest static key path prefix before the first unresolvable `${…}`.
   * `null` when no useful dotted prefix remains.
   */
  staticPrefix: string | null;
  /** Ordered raw interiors of runtime `${…}` holes. */
  runtimeSegments: string[];
  /** Simple identifier holes still unresolved after const substitution. */
  unresolvedPlaceholders: string[];
};
