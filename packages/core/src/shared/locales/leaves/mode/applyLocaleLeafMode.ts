import { getLocaleLeafAtPath, normalizeLocaleDocumentToNestedCanonical } from '../../../json/localeLeafPath.js';
import { setAtPath } from '../../../json/path.js';
import type {
  LocaleMetadataLeafDecision,
  LocaleMetadataPathChange,
  LocaleMetadataReport,
  LocaleMetadataRepairReason,
} from '../../../../types/locales/leaves/index.js';
import type { ApplyLocaleMetadataModeInput } from '../../../../types/locales/leaves/localeLeafInputs.js';
import {
  bump,
  classifyLeafRuntimeKind,
  initReasonMap,
  isPlainObjectForLocaleLeaves,
  normalizeStructuredLeaf,
} from './applyModeHelpers.js';

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
    const cur = getLocaleLeafAtPath(next, leafPath);
    const beforeKind = classifyLeafRuntimeKind(cur);
    const beforeValue = cur;
    if (input.mode === 'legacy_string') {
      const nextValue =
        typeof cur === 'string' ? cur : isPlainObjectForLocaleLeaves(cur) && typeof cur.value === 'string' ? cur.value : sourceValue;
      let action: LocaleMetadataLeafDecision['action'] = 'unchanged';
      const reasons: LocaleMetadataRepairReason[] = [];
      if (typeof cur === 'undefined') {
        missingPathsHydratedFromSource += 1;
        action = 'hydrated_missing';
      }
      if (isPlainObjectForLocaleLeaves(cur) && typeof cur.value === 'string') {
        strippedStructuredLeaves += 1;
        action = 'stripped_structured';
      }
      if (cur === nextValue) unchangedLeaves += 1;
      else next = setAtPath(next, leafPath, nextValue);
      const afterValue = getLocaleLeafAtPath(next, leafPath);
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
    const afterValue = getLocaleLeafAtPath(next, leafPath);
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

  const leafPaths = [...input.sourceMap.keys()];
  next = normalizeLocaleDocumentToNestedCanonical(next, leafPaths);

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
