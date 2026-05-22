import { describe, expect, it } from 'vitest';
import { buildStoredReportMetadata } from '../reportMetadata.js';
import type { ReportStoreRow } from '../../types/project/reportStore.js';

describe('buildStoredReportMetadata', () => {
  it('omits document body and surfaces summary fields', () => {
    const row: ReportStoreRow = {
      reportId: 'abc',
      payloadContentHash: 'hash',
      byteSize: 100,
      storedAt: '2026-01-01T00:00:00.000Z',
      lastAccessedAt: '2026-01-02T00:00:00.000Z',
      ingestRoute: 'prepared',
      prepareHost: 'cli-share',
      document: {
        kind: 'i18nprune.projectReport',
        schemaVersion: 1,
        generatedAt: '2026-01-01T00:00:00.000Z',
        toolVersion: 'test/1',
        project: {
          sourceLocalePath: 'locales/en.json',
          localesDir: 'locales',
          srcRoot: 'src',
          sourceLocaleTag: 'en',
        },
        summary: {
          missingKeysCount: 2,
          dynamicSitesCount: 3,
          keyObservationsCount: 4,
          ok: false,
        },
        details: { missingKeys: [], dynamicSites: [], keyObservations: [] },
      },
    };
    const meta = buildStoredReportMetadata(row);
    expect(meta.reportId).toBe('abc');
    expect(meta.timing.lastAccessedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(meta.processor.surface).toBe('cli');
    expect(meta.summary.ok).toBe(false);
    expect(meta.project.sourceLocaleTag).toBe('en');
    expect('document' in meta).toBe(false);
  });
});
