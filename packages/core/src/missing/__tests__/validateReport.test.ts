import { describe, it, expect } from 'vitest';
import { I18nPruneError } from '../../shared/errors/internal.js';
import { parseMissingArrayFromValidateReportJson, planMissingPathsFromReport } from '../validateReport.js';

describe('missing validateReport', () => {
  it('parseMissingArrayFromValidateReportJson reads missing[]', () => {
    expect(parseMissingArrayFromValidateReportJson({ missing: ['a', 'b', ''] })).toEqual(['a', 'b']);
  });

  it('parseMissingArrayFromValidateReportJson throws on bad shape', () => {
    expect(() => parseMissingArrayFromValidateReportJson(null)).toThrow(I18nPruneError);
    expect(() => parseMissingArrayFromValidateReportJson({ missing: 1 })).toThrow(I18nPruneError);
  });

  it('planMissingPathsFromReport', () => {
    const used = new Set(['a', 'b']);
    const leaves = new Set(['a']);
    expect(
      planMissingPathsFromReport(['a', 'b', 'orphan'], used, leaves),
    ).toEqual({
      toAdd: ['b'],
      skippedNotInScan: ['orphan'],
    });
  });
});
