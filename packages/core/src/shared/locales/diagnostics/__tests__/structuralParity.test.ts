import { describe, expect, it } from 'vitest';
import {
  collectLocaleStructuralParityDiagnostics,
  localeStructuralSlot,
} from '../structuralParity.js';
import type { LocaleSegmentRef } from '../../../../types/locales/enumerate.js';

describe('localeStructuralSlot', () => {
  it('maps locale_per_dir paths to path after locale prefix', () => {
    expect(localeStructuralSlot('locale_per_dir', 'en/auth.json')).toBe('auth.json');
    expect(localeStructuralSlot('locale_per_dir', 'orphan.json')).toBeNull();
  });

  it('maps feature_bundle paths to feature directory', () => {
    expect(localeStructuralSlot('feature_bundle', 'auth/en.json')).toBe('auth');
    expect(localeStructuralSlot('feature_bundle', 'dashboard/en.json')).toBe('dashboard');
  });
});

describe('collectLocaleStructuralParityDiagnostics', () => {
  const seg = (locale: string, relativePath: string): LocaleSegmentRef => ({
    locale,
    relativePath,
    absolutePath: `/proj/${relativePath}`,
  });

  it('warns when a locale is missing a segment slot', () => {
    const segments: LocaleSegmentRef[] = [
      seg('en', 'en/auth.json'),
      seg('en', 'en/dashboard.json'),
      seg('fr', 'fr/auth.json'),
    ];
    const diagnostics = collectLocaleStructuralParityDiagnostics({
      structure: 'locale_per_dir',
      segments,
      referenceLocale: 'en',
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe('locale_structure_slot_missing');
    expect(diagnostics[0]?.message).toContain('dashboard.json');
    expect(diagnostics[0]?.message).toContain('fr');
  });

  it('warns on extra slots for feature_bundle layouts', () => {
    const segments: LocaleSegmentRef[] = [
      seg('en', 'auth/en.json'),
      seg('en', 'dashboard/en.json'),
      seg('fr', 'auth/fr.json'),
      seg('fr', 'orphan/fr.json'),
    ];
    const diagnostics = collectLocaleStructuralParityDiagnostics({
      structure: 'feature_bundle',
      segments,
      referenceLocale: 'en',
    });
    const codes = diagnostics.map((d) => d.code).sort();
    expect(codes).toEqual(['locale_structure_slot_extra', 'locale_structure_slot_missing']);
  });

  it('returns no diagnostics for a single locale', () => {
    const segments: LocaleSegmentRef[] = [seg('en', 'en/a.json')];
    expect(
      collectLocaleStructuralParityDiagnostics({ structure: 'locale_per_dir', segments }),
    ).toHaveLength(0);
  });
});
