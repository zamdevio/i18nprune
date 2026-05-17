import { describe, expect, it } from 'vitest';
import type { StringLeaf } from '../../types/json/index.js';
import { collectTranslationSurfaceLeaves } from '../../shared/locales/leaves/index.js';
import {
  canonicalTemplatePathForCollectedLeaf,
  readLeafDisplayString,
  summarizeSyncLeavesForHumanLog,
} from '../humanLeafSummary.js';

describe('humanLeafSummary', () => {
  describe('readLeafDisplayString', () => {
    it('reads plain and structured terminals', () => {
      expect(readLeafDisplayString({ a: 'x' }, 'a')).toBe('x');
      expect(readLeafDisplayString({ a: { value: 'y', note: 'n' } }, 'a')).toBe('y');
      expect(readLeafDisplayString({}, 'missing')).toBeUndefined();
    });
  });

  describe('canonicalTemplatePathForCollectedLeaf', () => {
    it('maps .value collectors to plain template paths', () => {
      const templatePaths = new Set(['k']);
      expect(canonicalTemplatePathForCollectedLeaf('k.value', templatePaths)).toBe('k');
    });

    it('matches exact structured template paths', () => {
      const templatePaths = new Set(['k.value']);
      expect(canonicalTemplatePathForCollectedLeaf('k.value', templatePaths)).toBe('k.value');
    });
  });

  describe('summarizeSyncLeavesForHumanLog', () => {
    it('counts hydrated vs preserved and pruned extras', () => {
      const sourceLeaves: StringLeaf[] = [{ path: 'k', value: 'src' }];
      expect(summarizeSyncLeavesForHumanLog(sourceLeaves, {}, { k: 'src' })).toEqual({
        hydratedFromSource: 1,
        preservedExistingLeaves: 0,
        prunedExtraLeaves: 0,
      });

      expect(summarizeSyncLeavesForHumanLog(sourceLeaves, { k: 'old' }, { k: 'old' })).toEqual({
        hydratedFromSource: 0,
        preservedExistingLeaves: 1,
        prunedExtraLeaves: 0,
      });

      expect(
        summarizeSyncLeavesForHumanLog(sourceLeaves, { k: 'x', orphan: 'gone' }, { k: 'x' }),
      ).toEqual({
        hydratedFromSource: 0,
        preservedExistingLeaves: 1,
        prunedExtraLeaves: 1,
      });
    });

    it('aligns with collectTranslationSurfaceLeaves(template) paths for structured template leaves', () => {
      const template = { s: { value: 't' } };
      const leaves = collectTranslationSurfaceLeaves(template);
      const cur = { s: { value: 'loc' } };
      const fin = { s: { value: 'loc' } };
      expect(summarizeSyncLeavesForHumanLog(leaves, cur, fin)).toEqual({
        hydratedFromSource: 0,
        preservedExistingLeaves: 1,
        prunedExtraLeaves: 0,
      });
    });
  });
});
