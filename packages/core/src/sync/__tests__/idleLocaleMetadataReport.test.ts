import { describe, expect, it } from 'vitest';
import { idleLocaleMetadataReportForSkippedSync } from '../run.js';

describe('idleLocaleMetadataReportForSkippedSync', () => {
  it('reports an unchanged legacy-string metadata pass without leaf decisions', () => {
    const r = idleLocaleMetadataReportForSkippedSync(5);
    expect(r.mode).toBe('legacy_string');
    expect(r.totalSourceLeafPaths).toBe(5);
    expect(r.unchangedLeaves).toBe(5);
    expect(r.structuredLeavesWritten).toBe(0);
    expect(r.promotedLegacyLeaves).toBe(0);
    expect(r.repairedCorruptLeaves).toBe(0);
    expect(r.strippedStructuredLeaves).toBe(0);
    expect(r.missingPathsHydratedFromSource).toBe(0);
    expect(r.changedPathsSample).toEqual([]);
    expect(r.leafDecisions).toEqual([]);
    expect(Object.values(r.byReason).every((v) => v === 0)).toBe(true);
  });
});
