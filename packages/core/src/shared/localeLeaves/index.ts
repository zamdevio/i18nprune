import { getAtPath, setAtPath } from '../json/path.js';
import type {
  LocaleLeafMode,
  LocaleLeafRuntimeKind,
  LocaleMetadataPathChange,
  LocaleMetadataLeafDecision,
  LocaleMetadataRepairReason,
  LocaleMetadataReport,
  StructuredLocaleLeaf,
} from '../../types/localeLeaves/index.js';

export type ApplyLocaleMetadataModeInput = {
  localeJson: unknown;
  sourceMap: Map<string, string>;
  mode: LocaleLeafMode;
  sampleLimit?: number;
};

export type ResolveLocaleLeafModeInput = {
  configMode?: LocaleLeafMode;
  metadataFlag?: boolean;
  stripMetadataFlag?: boolean;
};

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function bump(m: Record<LocaleMetadataRepairReason, number>, key: LocaleMetadataRepairReason): void {
  m[key] = (m[key] ?? 0) + 1;
}

function initReasonMap(): Record<LocaleMetadataRepairReason, number> {
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
function shouldMaterializeCanonicalStructuredFields(cur: Record<string, unknown>): boolean {
  for (const k of MATERIALIZED_STRUCTURED_KEYS) {
    if (!(k in cur)) return true;
  }
  return false;
}

function classifyLeafRuntimeKind(cur: unknown): LocaleLeafRuntimeKind {
  if (typeof cur === 'undefined') return 'missing';
  if (typeof cur === 'string') return 'legacy_string';
  if (!isPlainObject(cur)) return 'other';
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

function normalizeStructuredLeaf(cur: unknown, sourceValue: string): {
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
  if (!isPlainObject(cur)) {
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
    isPlainObject(cur) &&
    typeof cur.value === 'string' &&
    shouldMaterializeCanonicalStructuredFields(cur as Record<string, unknown>);
  if (materialized && !changed) reasons.push('canonical_metadata_materialized');
  const effectiveChanged = changed || materialized;
  if (changed) {
    out.needsReview = true;
  }
  return { leaf: out, changed: effectiveChanged, reasons };
}

export function applyLocaleLeafMode(input: ApplyLocaleMetadataModeInput): { next: unknown; report: LocaleMetadataReport } {
  const changes: LocaleMetadataPathChange[] = [];
  const leafDecisions: LocaleMetadataLeafDecision[] = [];
  let next: unknown = input.localeJson;
  let unchangedLeaves = 0;
  let structuredLeavesWritten = 0;
  let promotedLegacyLeaves = 0;
  let repairedCorruptLeaves = 0;
  let strippedStructuredLeaves = 0;
  let missingPathsHydratedFromSource = 0;
  const byReason = initReasonMap();
  const sampleLimit = input.sampleLimit ?? 40;

  for (const [leafPath, sourceValue] of input.sourceMap.entries()) {
    const cur = getAtPath(next, leafPath);
    const beforeKind = classifyLeafRuntimeKind(cur);
    const beforeValue = cur;
    if (input.mode === 'legacy_string') {
      const nextValue =
        typeof cur === 'string' ? cur : isPlainObject(cur) && typeof cur.value === 'string' ? cur.value : sourceValue;
      let action: LocaleMetadataLeafDecision['action'] = 'unchanged';
      const reasons: LocaleMetadataRepairReason[] = [];
      if (typeof cur === 'undefined') {
        missingPathsHydratedFromSource += 1;
        action = 'hydrated_missing';
      }
      if (isPlainObject(cur) && typeof cur.value === 'string') {
        strippedStructuredLeaves += 1;
        action = 'stripped_structured';
      }
      if (cur === nextValue) unchangedLeaves += 1;
      else next = setAtPath(next, leafPath, nextValue);
      const afterValue = getAtPath(next, leafPath);
      const afterKind = classifyLeafRuntimeKind(afterValue);
      leafDecisions.push({
        path: leafPath,
        sourceValue,
        beforeKind,
        afterKind,
        action,
        reasons,
        beforeValue,
        afterValue,
      });
      continue;
    }

    const normalized = normalizeStructuredLeaf(cur, sourceValue);
    let action: LocaleMetadataLeafDecision['action'] = 'unchanged';
    if (normalized.changed) {
      next = setAtPath(next, leafPath, normalized.leaf);
      structuredLeavesWritten += 1;
      for (const reason of normalized.reasons) {
        bump(byReason, reason);
        if (changes.length < sampleLimit) changes.push({ path: leafPath, reason });
      }
      const hasLegacy = normalized.reasons.includes('legacy_string_promoted');
      const hasCorruptRepair = normalized.reasons.some(
        (r) => r !== 'legacy_string_promoted' && r !== 'canonical_metadata_materialized',
      );
      if (hasLegacy) {
        promotedLegacyLeaves += 1;
        action = 'promoted_legacy';
      }
      if (hasCorruptRepair) {
        repairedCorruptLeaves += 1;
        if (!hasLegacy) action = 'repaired_corrupt';
      }
    } else {
      unchangedLeaves += 1;
    }
    if (typeof cur === 'undefined') missingPathsHydratedFromSource += 1;
    const afterValue = getAtPath(next, leafPath);
    const afterKind = classifyLeafRuntimeKind(afterValue);
    leafDecisions.push({
      path: leafPath,
      sourceValue,
      beforeKind,
      afterKind,
      action,
      reasons: normalized.reasons,
      beforeValue,
      afterValue,
    });
  }

  return {
    next,
    report: {
      mode: input.mode,
      totalSourceLeafPaths: input.sourceMap.size,
      unchangedLeaves,
      structuredLeavesWritten,
      promotedLegacyLeaves,
      repairedCorruptLeaves,
      strippedStructuredLeaves,
      missingPathsHydratedFromSource,
      byReason,
      changedPathsSample: changes,
      leafDecisions,
    },
  };
}

export function metadataModeEnabledFromConfig(mode: LocaleLeafMode | undefined): boolean {
  return mode === 'structured';
}

/** Resolve final leaf mode with stable precedence: strip > metadata > config > legacy default. */
export function resolveLocaleLeafMode(input: ResolveLocaleLeafModeInput): {
  mode: LocaleLeafMode;
  conflict: boolean;
  reason: 'strip_precedence' | 'explicit_metadata' | 'config_structured' | 'default_legacy';
} {
  if (input.stripMetadataFlag === true) {
    return {
      mode: 'legacy_string',
      conflict: input.metadataFlag === true,
      reason: 'strip_precedence',
    };
  }
  if (input.metadataFlag === true) return { mode: 'structured', conflict: false, reason: 'explicit_metadata' };
  if (metadataModeEnabledFromConfig(input.configMode)) {
    return { mode: 'structured', conflict: false, reason: 'config_structured' };
  }
  return { mode: 'legacy_string', conflict: false, reason: 'default_legacy' };
}

/**
 * Resolve locale leaf mode ({@link resolveLocaleLeafMode}) then {@link applyLocaleLeafMode}.
 * Shared by **generate** and **fill** immediately after translation passes.
 */
export function applyLocaleLeafNormalization(input: {
  localeJson: unknown;
  sourceMap: Map<string, string>;
  resolveInput: ResolveLocaleLeafModeInput;
}): {
  next: unknown;
  report: LocaleMetadataReport;
  modeDecision: ReturnType<typeof resolveLocaleLeafMode>;
} {
  const modeDecision = resolveLocaleLeafMode(input.resolveInput);
  const normalized = applyLocaleLeafMode({
    localeJson: input.localeJson,
    sourceMap: input.sourceMap,
    mode: modeDecision.mode,
  });
  return {
    next: normalized.next,
    report: normalized.report,
    modeDecision,
  };
}
