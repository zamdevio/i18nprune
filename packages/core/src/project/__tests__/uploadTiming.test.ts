import { describe, expect, it } from 'vitest';
import { buildProjectUploadSnapshotMeta } from '../uploadTiming.js';
import type { ProjectSnapshot } from '../../types/project/upload.js';

function baseSnapshot(overrides: Partial<ProjectSnapshot> = {}): ProjectSnapshot {
  return {
    projectId: 'abc',
    projectHash: 'hash',
    requestReceivedAt: '2026-01-01T00:00:00.000Z',
    uploadedAt: '2026-01-01T00:00:00.050Z',
    storedAt: '2026-01-01T00:00:01.000Z',
    zipBytes: 1,
    fileCount: 1,
    textFileCount: 1,
    detectedConfigPath: null,
    detectedConfigRaw: null,
    tree: [],
    resolvedConfig: null,
    sourceLocaleJson: null,
    localeJsonByTag: {},
    extraction: {
      configHash: 'h',
      sourceLocalePath: 'locales/en.json',
      srcRoot: 'src',
      localesDir: 'locales',
      resolvedKeys: [],
      keyObservationsCount: 0,
      dynamicSitesCount: 0,
      keyObservationsPreview: [],
      dynamicSitesPreview: [],
      extractionStartedAt: '2026-01-01T00:00:00.100Z',
      computedAt: '2026-01-01T00:00:00.800Z',
    },
    ...overrides,
  };
}

describe('buildProjectUploadSnapshotMeta', () => {
  it('returns monotonic timing deltas in milliseconds', () => {
    const meta = buildProjectUploadSnapshotMeta(baseSnapshot());
    expect(meta.extractionMs).toBe(700);
    expect(meta.persistMs).toBe(200);
    expect(meta.totalMs).toBe(1000);
    expect(meta.extractionStartedAt).toBe('2026-01-01T00:00:00.100Z');
    expect(meta.storedAt).toBe('2026-01-01T00:00:01.000Z');
  });

  it('falls back when legacy snapshots omit new timestamp fields', () => {
    const meta = buildProjectUploadSnapshotMeta(
      baseSnapshot({
        requestReceivedAt: undefined,
        storedAt: undefined,
        extraction: {
          ...baseSnapshot().extraction!,
          extractionStartedAt: undefined,
        },
      }),
    );
    expect(meta.requestReceivedAt).toBe('2026-01-01T00:00:00.050Z');
    expect(meta.extractionStartedAt).toBe('2026-01-01T00:00:00.050Z');
    expect(meta.storedAt).toBe('2026-01-01T00:00:00.800Z');
  });
});
