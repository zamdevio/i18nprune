import type {
  LocaleLeafRuntimeKind,
  LocaleMetadataRepairReason,
  StructuredLocaleLeaf,
} from '../../../../types/locales/leaves/index.js';

export function isPlainObjectForLocaleLeaves(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function bump(m: Record<LocaleMetadataRepairReason, number>, key: LocaleMetadataRepairReason): void {
  m[key] = (m[key] ?? 0) + 1;
}

export function initReasonMap(): Record<LocaleMetadataRepairReason, number> {
  return {
    legacy_string_promoted: 0,
    non_object_replaced: 0,
    missing_value: 0,
    invalid_status: 0,
    invalid_confidence: 0,
    invalid_needs_review: 0,
    invalid_needs_translation_again: 0,
    invalid_source: 0,
    canonical_metadata_materialized: 0,
  };
}

const MATERIALIZED_STRUCTURED_KEYS = [
  'value',
  'status',
  'confidence',
  'needsReview',
  'source',
  'needsTranslationAgain',
] as const;

/** True when **`out`** would JSON-serialize with explicit keys **`cur`** does not declare (thin metadata → full canonical leaf). */
export function shouldMaterializeCanonicalStructuredFields(cur: Record<string, unknown>): boolean {
  for (const k of MATERIALIZED_STRUCTURED_KEYS) {
    if (!(k in cur)) return true;
  }
  return false;
}

export function classifyLeafRuntimeKind(cur: unknown): LocaleLeafRuntimeKind {
  if (typeof cur === 'undefined') return 'missing';
  if (typeof cur === 'string') return 'legacy_string';
  if (!isPlainObjectForLocaleLeaves(cur)) return 'other';
  if (typeof cur.value === 'string') {
    const validStatus = cur.status === undefined || (typeof cur.status === 'string' && cur.status.trim().length > 0);
    const validConfidence =
      cur.confidence === undefined ||
      cur.confidence === null ||
      (typeof cur.confidence === 'number' && Number.isFinite(cur.confidence));
    const validNeedsReview = cur.needsReview === undefined || typeof cur.needsReview === 'boolean';
    const validNeedsTranslationAgain =
      cur.needsTranslationAgain === undefined || typeof cur.needsTranslationAgain === 'boolean';
    const validSource = cur.source === undefined || (typeof cur.source === 'string' && cur.source.trim().length > 0);
    return validStatus && validConfidence && validNeedsReview && validNeedsTranslationAgain && validSource
      ? 'structured_valid'
      : 'structured_corrupt';
  }
  return 'structured_corrupt';
}

export function normalizeStructuredLeaf(cur: unknown, sourceValue: string): {
  leaf: StructuredLocaleLeaf;
  changed: boolean;
  reasons: LocaleMetadataRepairReason[];
} {
  const roundConfidence = (v: number): number => Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;
  const reasons: LocaleMetadataRepairReason[] = [];
  if (typeof cur === 'string') {
    reasons.push('legacy_string_promoted');
    return {
      leaf: {
        value: cur,
        status: 'translated',
        confidence: null,
        needsReview: true,
        needsTranslationAgain: false,
        source: 'manual',
      },
      changed: true,
      reasons,
    };
  }
  if (!isPlainObjectForLocaleLeaves(cur)) {
    reasons.push('non_object_replaced');
    return {
      leaf: {
        value: sourceValue,
        status: 'pending',
        confidence: null,
        needsReview: true,
        needsTranslationAgain: true,
        source: 'sync',
      },
      changed: true,
      reasons,
    };
  }
  let changed = false;
  const out: StructuredLocaleLeaf = { value: sourceValue };
  if (typeof cur.value === 'string') out.value = cur.value;
  else {
    changed = true;
    reasons.push('missing_value');
  }
  if (typeof cur.status === 'string' && cur.status.trim().length > 0) {
    out.status = cur.status;
  } else if (cur.status === undefined) {
    out.status = 'translated';
  } else {
    out.status = 'translated';
    changed = true;
    reasons.push('invalid_status');
  }
  if (typeof cur.confidence === 'number' && Number.isFinite(cur.confidence)) out.confidence = roundConfidence(cur.confidence);
  else if (cur.confidence === null || cur.confidence === undefined) out.confidence = null;
  else {
    out.confidence = null;
    changed = true;
    reasons.push('invalid_confidence');
  }
  if (typeof cur.needsReview === 'boolean') {
    out.needsReview = cur.needsReview;
  } else if (cur.needsReview === undefined) {
    out.needsReview = false;
  } else {
    out.needsReview = false;
    changed = true;
    reasons.push('invalid_needs_review');
  }
  if (typeof cur.source === 'string' && cur.source.trim().length > 0) {
    out.source = cur.source;
  } else if (cur.source === undefined) {
    out.source = 'manual';
  } else {
    out.source = 'manual';
    changed = true;
    reasons.push('invalid_source');
  }
  if (typeof cur.needsTranslationAgain === 'boolean') out.needsTranslationAgain = cur.needsTranslationAgain;
  else if ('needsTranslationAgain' in cur) {
    out.needsTranslationAgain = false;
    changed = true;
    reasons.push('invalid_needs_translation_again');
  } else {
    out.needsTranslationAgain = false;
  }
  const materialized =
    isPlainObjectForLocaleLeaves(cur) &&
    typeof cur.value === 'string' &&
    shouldMaterializeCanonicalStructuredFields(cur as Record<string, unknown>);
  if (materialized && !changed) reasons.push('canonical_metadata_materialized');
  const effectiveChanged = changed || materialized;
  if (changed) {
    out.needsReview = true;
  }
  return { leaf: out, changed: effectiveChanged, reasons };
}
