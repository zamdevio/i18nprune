import { describe, expect, it } from 'vitest';
import { DEFAULT_MISSING_LEAF_PLACEHOLDER } from '../../constants/missing.js';
import {
  ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES,
  ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES,
} from '../../constants/issueCodes.js';
import {
  detectLocalePlaceholderLeaves,
  issuesFromSourcePlaceholderLeaves,
  issuesFromTargetPlaceholderLeaves,
  sourcePlaceholderValues,
} from '../index.js';

describe('source placeholder helpers', () => {
  it('builds separate source and target locale placeholder issues', () => {
    const placeholderValues = sourcePlaceholderValues(DEFAULT_MISSING_LEAF_PLACEHOLDER);
    const sourceLeaves = detectLocalePlaceholderLeaves({
      leaves: [{ path: 'app.brand', value: DEFAULT_MISSING_LEAF_PLACEHOLDER }],
      placeholderValues,
      localeRole: 'source',
      localeCode: 'en',
    });
    const targetLeaves = detectLocalePlaceholderLeaves({
      leaves: [{ path: 'app.cta', value: DEFAULT_MISSING_LEAF_PLACEHOLDER }],
      placeholderValues,
      localeRole: 'target',
      localeCode: 'ja',
    });

    expect(issuesFromSourcePlaceholderLeaves(sourceLeaves)).toEqual([
      expect.objectContaining({
        code: ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES,
        severity: 'warning',
      }),
    ]);
    expect(issuesFromTargetPlaceholderLeaves(targetLeaves)).toEqual([
      expect.objectContaining({
        code: ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES,
        severity: 'warning',
      }),
    ]);
  });
});
