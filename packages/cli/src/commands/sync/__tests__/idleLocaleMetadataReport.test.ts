import { describe, expect, it } from 'vitest';
import { idleLocaleMetadataReportForSkippedSync } from '../idleLocaleMetadataReport.js';

describe('idleLocaleMetadataReportForSkippedSync', () => {
  it('fills a neutral localeMetadataReports row', () => {
    const r = idleLocaleMetadataReportForSkippedSync(5);
    expect(r.totalSourceLeafPaths).toBe(5);
    expect(r.unchangedLeaves).toBe(5);
    expect(r.mode).toBe('legacy_string');
    expect(r.leafDecisions).toHaveLength(0);
    expect(r.byReason.invalid_source).toBe(0);
  });
});
