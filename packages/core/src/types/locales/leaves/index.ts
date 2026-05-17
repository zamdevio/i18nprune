export type { LocaleSegmentSource, LocaleLeafPathApi, LocaleLeafFileOrigin } from './segmentSource.js';
export type {
  TranslationSurfaceLeaf,
  TranslationSurfaceShape,
} from './translationSurface.js';

export type LocaleLeafMode = 'legacy_string' | 'structured';

export type StructuredLocaleLeaf = {
  value: string;
  status?: string;
  confidence?: number | null;
  needsReview?: boolean;
  needsTranslationAgain?: boolean;
  source?: string;
};

export type LocaleMetadataRepairReason =
  | 'legacy_string_promoted'
  | 'non_object_replaced'
  | 'missing_value'
  | 'invalid_status'
  | 'invalid_confidence'
  | 'invalid_needs_review'
  | 'invalid_needs_translation_again'
  | 'invalid_source'
  | 'canonical_metadata_materialized';

export type LocaleMetadataPathChange = {
  path: string;
  reason: LocaleMetadataRepairReason;
};

export type LocaleLeafRuntimeKind =
  | 'missing'
  | 'legacy_string'
  | 'structured_valid'
  | 'structured_corrupt'
  | 'other';

export type LocaleLeafDecisionAction =
  | 'unchanged'
  | 'hydrated_missing'
  | 'promoted_legacy'
  | 'repaired_corrupt'
  | 'stripped_structured';

export type LocaleMetadataLeafDecision = {
  path: string;
  sourceValue: string;
  beforeKind: LocaleLeafRuntimeKind;
  afterKind: LocaleLeafRuntimeKind;
  action: LocaleLeafDecisionAction;
  reasons: LocaleMetadataRepairReason[];
  beforeValue: unknown;
  afterValue: unknown;
};

export type LocaleMetadataReport = {
  mode: LocaleLeafMode;
  totalSourceLeafPaths: number;
  unchangedLeaves: number;
  structuredLeavesWritten: number;
  promotedLegacyLeaves: number;
  repairedCorruptLeaves: number;
  strippedStructuredLeaves: number;
  missingPathsHydratedFromSource: number;
  byReason: Record<LocaleMetadataRepairReason, number>;
  changedPathsSample: LocaleMetadataPathChange[];
  leafDecisions: LocaleMetadataLeafDecision[];
};
