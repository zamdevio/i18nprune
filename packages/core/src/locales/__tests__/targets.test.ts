import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { I18nPruneError } from '../../shared/errors/index.js';
import {
  isAllLocaleToken,
  parseLocaleCodesList,
  parseSyncLangSelection,
  pickTargetSelector,
  resolveLocaleTargetCodes,
  resolveTargetLocaleSlugs,
} from '../targets.js';

describe('locale target resolver', () => {
  const rt = createNodeRuntimeAdapters();
  const sourceLocalePath = '/proj/locales/en.json';
  const localeSlugs = ['en', 'fr', 'ar'];

  it('parses and normalizes code list', () => {
    expect(parseLocaleCodesList(' FR, ar ,pt-BR')).toEqual(['fr', 'ar', 'pt-br']);
  });

  it('detects all token', () => {
    expect(isAllLocaleToken('ALL')).toBe(true);
    expect(isAllLocaleToken('fr')).toBe(false);
  });

  it('normalizes selector', () => {
    expect(pickTargetSelector(' fr ')).toBe('fr');
    expect(pickTargetSelector('')).toBeUndefined();
  });

  it('parses sync selection policy', () => {
    expect(parseSyncLangSelection(undefined)).toEqual({ mode: 'all' });
    expect(parseSyncLangSelection('all')).toEqual({ mode: 'all' });
    expect(parseSyncLangSelection('ja, pt-br')).toEqual({ mode: 'codes', codes: ['ja', 'pt-br'] });
  });

  it('returns non-source target slugs', () => {
    expect(resolveTargetLocaleSlugs(rt.path, localeSlugs, sourceLocalePath)).toEqual(['fr', 'ar']);
  });

  it('resolves explicit targets', () => {
    expect(
      resolveLocaleTargetCodes({
        commandName: 'locales delete',
        rawTarget: 'fr,AR',
        localeSlugs,
        sourceLocalePath,
        path: rt.path,
      }),
    ).toEqual(['fr', 'ar']);
  });

  it('resolves all token to all non-source targets', () => {
    expect(
      resolveLocaleTargetCodes({
        commandName: 'locales delete',
        rawTarget: 'all',
        localeSlugs,
        sourceLocalePath,
        path: rt.path,
      }),
    ).toEqual(['fr', 'ar']);
  });

  it('throws when target is unknown', () => {
    expect(() =>
      resolveLocaleTargetCodes({
        commandName: 'locales delete',
        rawTarget: 'de',
        localeSlugs,
        sourceLocalePath,
        path: rt.path,
      }),
    ).toThrow(I18nPruneError);
  });
});
