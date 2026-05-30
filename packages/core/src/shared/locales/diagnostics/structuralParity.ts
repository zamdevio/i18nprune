import type { LocalesLayoutStructure } from '../../../types/locales/layout.js';
import type { LocaleSegmentRef } from '../../../types/locales/enumerate.js';
import type { LocaleReadDiagnostic } from '../../../types/locales/read.js';

/**
 * Locale-neutral segment slot for comparing trees across locale codes.
 *
 * @remarks `locale_per_dir`: `en/auth.json` → `auth.json`; `feature_bundle`: `auth/en.json` → `auth`.
 */
export function localeStructuralSlot(
  structure: LocalesLayoutStructure,
  relativePath: string,
): string | null {
  if (structure === 'locale_per_dir') {
    const slash = relativePath.indexOf('/');
    if (slash < 0) return null;
    const slot = relativePath.slice(slash + 1);
    return slot.length > 0 ? slot : null;
  }
  if (structure === 'feature_bundle') {
    const slash = relativePath.lastIndexOf('/');
    if (slash < 0) return null;
    const slot = relativePath.slice(0, slash);
    return slot.length > 0 ? slot : null;
  }
  return null;
}

function slotsByLocale(
  structure: LocalesLayoutStructure,
  segments: readonly LocaleSegmentRef[],
): Map<string, Set<string>> {
  const byLocale = new Map<string, Set<string>>();
  for (const segment of segments) {
    const slot = localeStructuralSlot(structure, segment.relativePath);
    if (slot === null) continue;
    let set = byLocale.get(segment.locale);
    if (!set) {
      set = new Set();
      byLocale.set(segment.locale, set);
    }
    set.add(slot);
  }
  return byLocale;
}

function pickReferenceLocale(byLocale: Map<string, Set<string>>, preferred?: string): string | null {
  if (preferred !== undefined && byLocale.has(preferred)) return preferred;
  let best: string | null = null;
  let bestSize = -1;
  for (const [locale, slots] of byLocale) {
    if (slots.size > bestSize) {
      best = locale;
      bestSize = slots.size;
    }
  }
  return best;
}

/**
 * Warn when locale codes disagree on which segment slots exist (multi-segment layouts only).
 */
export function collectLocaleStructuralParityDiagnostics(input: {
  structure: LocalesLayoutStructure;
  segments: readonly LocaleSegmentRef[];
  referenceLocale?: string;
}): LocaleReadDiagnostic[] {
  const { structure, segments } = input;
  if (structure !== 'locale_per_dir' && structure !== 'feature_bundle') {
    return [];
  }

  const byLocale = slotsByLocale(structure, segments);
  if (byLocale.size < 2) return [];

  const reference = pickReferenceLocale(byLocale, input.referenceLocale);
  if (reference === null) return [];

  const referenceSlots = byLocale.get(reference);
  if (!referenceSlots || referenceSlots.size === 0) return [];

  const diagnostics: LocaleReadDiagnostic[] = [];

  for (const [locale, slots] of byLocale) {
    if (locale === reference) continue;
    for (const slot of referenceSlots) {
      if (!slots.has(slot)) {
        diagnostics.push({
          level: 'warn',
          code: 'locale_structure_slot_missing',
          message: `locale ${locale} is missing segment slot ${slot} (present for reference locale ${reference})`,
        });
      }
    }
    for (const slot of slots) {
      if (!referenceSlots.has(slot)) {
        diagnostics.push({
          level: 'warn',
          code: 'locale_structure_slot_extra',
          message: `locale ${locale} has extra segment slot ${slot} (not present for reference locale ${reference})`,
        });
      }
    }
  }

  diagnostics.sort((a, b) => a.message.localeCompare(b.message));
  return diagnostics;
}

/**
 * Warn when the configured source locale is missing segment slots that exist for other locales
 * (`locale_per_dir` / `feature_bundle` only).
 */
export function collectSourceLocaleMissingSegmentDiagnostics(input: {
  structure: LocalesLayoutStructure;
  segments: readonly LocaleSegmentRef[];
  sourceLocale: string;
}): LocaleReadDiagnostic[] {
  const { structure, segments, sourceLocale } = input;
  if (structure !== 'locale_per_dir' && structure !== 'feature_bundle') {
    return [];
  }

  const byLocale = slotsByLocale(structure, segments);
  const sourceSlots = byLocale.get(sourceLocale);
  if (!sourceSlots) return [];

  const peerSlots = new Set<string>();
  for (const [locale, slots] of byLocale) {
    if (locale === sourceLocale) continue;
    for (const slot of slots) {
      peerSlots.add(slot);
    }
  }
  if (peerSlots.size === 0) return [];

  const diagnostics: LocaleReadDiagnostic[] = [];
  for (const slot of peerSlots) {
    if (!sourceSlots.has(slot)) {
      diagnostics.push({
        level: 'warn',
        code: 'source_locale_segment_slot_missing',
        message: `source locale ${sourceLocale} is missing segment ${slot} (present for other locale(s) under locales.directory)`,
      });
    }
  }

  diagnostics.sort((a, b) => a.message.localeCompare(b.message));
  return diagnostics;
}
