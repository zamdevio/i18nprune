// src/types/core.ts

/** 
 * Represents a translation value in the target JSON file. 
 * i18nprune supports both plain strings (legacy_string) and rich metadata objects (structured).
 */
export type LocaleLeafValue = string | {
  value: string;
  status?: string;
  needsReview?: boolean;
  confidence?: number;
};

/** Exact location in the user's source code where a key was found */
export interface SourceSpan {
  filePath?: string;
  line: number;
  column?: number;
  functionName?: string;
}

/** Observations from the scanner. Handles both static strings and dynamic template literals. */
export type KeyObservation = 
  | { kind: 'literal'; resolvedKey: string; span: SourceSpan; }
  | { kind: 'template_resolved'; resolvedKey: string; span: SourceSpan; }
  | { kind: 'template_partial'; templateRaw: string; unresolvedPlaceholders: string[]; span: SourceSpan; };

/** Real stats engine output for the Review & Sync dashboard */
export interface ReviewLocaleStats {
  locale: string;
  stringPaths: number;
  englishIdentical: number;
  legacyLeaves: number;      // Count of plain string values
  structuredLeaves: number;  // Count of rich object values
  needsReviewTrue: number;
  missingTranslations: number;
}
