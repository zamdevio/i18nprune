import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { filterLocaleFilesForReview, parseReviewTargetCodes } from '../targetScope.js';

describe('parseReviewTargetCodes', () => {
  it('returns undefined for all and empty', () => {
    expect(parseReviewTargetCodes(undefined)).toBeUndefined();
    expect(parseReviewTargetCodes('')).toBeUndefined();
    expect(parseReviewTargetCodes('  ')).toBeUndefined();
    expect(parseReviewTargetCodes('all')).toBeUndefined();
    expect(parseReviewTargetCodes('ALL')).toBeUndefined();
  });

  it('parses comma list and strips json suffix', () => {
    expect(parseReviewTargetCodes('ja')).toEqual(['ja']);
    expect(parseReviewTargetCodes('ja.json, ar')).toEqual(['ja', 'ar']);
  });
});

describe('filterLocaleFilesForReview', () => {
  it('filters case-insensitively', () => {
    const rt = createNodeRuntimeAdapters();
    const files = ['ja.json', 'AR.json', 'de.json'];
    expect(filterLocaleFilesForReview(rt.path, files, ['ja', 'ar'])).toEqual(['ja.json', 'AR.json']);
  });
});
