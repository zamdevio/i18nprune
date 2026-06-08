/**
 * Rich observations for literal and template-resolved translation keys (keySites phase).
 * Heuristic dynamic sites stay under `types/extractor/dynamic`.
 */

/** Where an observation was found (merged scan may omit `filePath`). */
export type SourceSpan = {
  filePath?: string;
  line: number;
  column?: number;
  functionName?: string;
  /** True when the translation call spans multiple lines. */
  isMultilineCall?: boolean;
  /** UTF-16 offset of the translation call in the file (for comment filtering). */
  charOffset?: number;
};

/** One step replacing `${identifier}` using `constMap` during template resolution. */
export type ConstSubstitutionStep = {
  identifier: string;
  value: string;
};

/** Optional cross-link to a heuristic dynamic site (same file:line when matched). */
export type DynamicKeyRef = {
  filePath?: string;
  line?: number;
};

export type LiteralKeyObservation = {
  kind: 'literal';
  resolvedKey: string;
  /** Inner string as matched, e.g. `a.b.c` */
  raw: string;
  span: SourceSpan;
  dynamicRef?: DynamicKeyRef;
};

export type TemplateResolvedKeyObservation = {
  kind: 'template_resolved';
  resolvedKey: string;
  templateRaw: string;
  substitutions: ConstSubstitutionStep[];
  span: SourceSpan;
  dynamicRef?: DynamicKeyRef;
};

export type TemplatePartialKeyObservation = {
  kind: 'template_partial';
  templateRaw: string;
  substitutions: ConstSubstitutionStep[];
  /** `${name}` segments still unresolved after constMap */
  unresolvedPlaceholders: string[];
  span: SourceSpan;
  /**
   * Cross-link to the paired dynamic `template_interpolation` site (same call).
   * When set, {@link literalKeyUsageFromObservations} omits `uncertainPrefix` so reference
   * merge collects the static prefix from the dynamic pass exactly once.
   */
  dynamicRef?: DynamicKeyRef;
  /**
   * Longest static key path prefix before the first unresolvable `${…}` (see dynamic rebuild),
   * when it contains a dot segment; used for uncertain-key protection.
   */
  uncertainPrefix?: string;
};

export type KeyObservation = LiteralKeyObservation | TemplateResolvedKeyObservation | TemplatePartialKeyObservation;

export type { ScanKeyObservationsOptions } from './scan.js';
export type { ScanProjectKeyObservationsInput } from './orchestrate.js';
export type { ScanProjectLiteralKeyUsageInput } from './projectUsage.js';
