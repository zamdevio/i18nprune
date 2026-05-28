import { describe, expect, it } from 'vitest';
import { buildStoredReportMetadata } from '../reportMetadata.js';
import type { ReportStoreRow } from '../../types/project/report/index.js';

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
    expect(meta.artifact.id).toBe('abc');
    expect(meta.timing.lastAccessedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(meta.processor.surface).toBe('cli');
    expect(meta.summary.ok).toBe(false);
    expect(meta.analysis.sourceLocalePath).toBe('locales/en.json');
    expect(meta.schemaVersion).toBe(1);
    expect(meta.formatVersion).toBe(1);
    expect(meta.capabilities.readOperations).toEqual(['metadata', 'document']);
    expect('document' in meta).toBe(false);
  });

  it('surfaces archive prepare timings on metadata GET', () => {
    const row: ReportStoreRow = {
      reportId: 'r1',
      payloadContentHash: 'hash',
      byteSize: 100,
      storedAt: '2026-01-01T00:00:01.000Z',
      ingestRoute: 'archive',
      prepareHost: 'worker-archive',
      requestReceivedAt: '2026-01-01T00:00:00.000Z',
      prepareMeta: { prepareHost: 'worker-archive', zipParsedMs: 12, extractionMs: 800, totalMs: 812 },
      processorContext: { surface: 'worker', route: 'archive', sdk: 'i18nprune-worker', toolVersion: 'i18nprune-worker' },
      document: {
        kind: 'i18nprune.projectReport',
        schemaVersion: 1,
        generatedAt: '2026-01-01T00:00:00.812Z',
        toolVersion: 'i18nprune-worker',
        project: { sourceLocalePath: 'locales/en.json', localesDir: 'locales', srcRoot: 'src' },
        summary: { missingKeysCount: 0, dynamicSitesCount: 0, keyObservationsCount: 0, ok: true },
        details: { missingKeys: [], dynamicSites: [], keyObservations: [] },
      },
    };
    const meta = buildStoredReportMetadata(row);
    expect(meta.timing.requestReceivedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(meta.timing.prepare?.extractionMs).toBe(800);
    expect(meta.timing.edge.persistMs).toBe(188);
    expect(meta.execution.route).toBe('archive');
    expect(meta.artifact.formatVersion).toBe(1);
  });
});
