import { describe, expect, it } from 'vitest';
import { alignArchiveSnapshotTimings } from '../prepare/alignArchiveTimings.js';
import type { ProjectSnapshot } from '../../types/project/upload.js';

describe('alignArchiveSnapshotTimings', () => {
  it('maps prepare ms onto uploadedAt and extraction ISO fields', () => {
    const snapshot: ProjectSnapshot = {
      projectId: 'p1',
      projectHash: 'h1',
      uploadedAt: '2026-01-01T00:00:00.000Z',
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
        configHash: 'c',
        sourceLocalePath: 'locales/en.json',
        srcRoot: 'src',
        localesDir: 'locales',
        resolvedKeys: [],
        keyObservationsCount: 1,
        dynamicSitesCount: 1,
        keyObservationsPreview: [],
        dynamicSitesPreview: [],
        extractionStartedAt: '2026-01-01T00:00:00.000Z',
        computedAt: '2026-01-01T00:00:00.000Z',
      },
    };

    alignArchiveSnapshotTimings({
      snapshot,
      requestReceivedAt: '2026-01-01T00:00:00.000Z',
      prepareMeta: { prepareHost: 'worker-archive', zipParsedMs: 40, extractionMs: 900, totalMs: 940 },
    });

    expect(snapshot.uploadedAt).toBe('2026-01-01T00:00:00.040Z');
    expect(snapshot.extraction?.extractionStartedAt).toBe('2026-01-01T00:00:00.040Z');
    expect(snapshot.extraction?.computedAt).toBe('2026-01-01T00:00:00.940Z');
  });

  it('derives extraction window from totalMs when extractionMs is zero', () => {
    const snapshot: ProjectSnapshot = {
      projectId: 'p1',
      projectHash: 'h1',
      uploadedAt: '2026-01-01T00:00:00.000Z',
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
        configHash: 'c',
        sourceLocalePath: 'locales/en.json',
        srcRoot: 'src',
        localesDir: 'locales',
        resolvedKeys: [],
        keyObservationsCount: 1,
        dynamicSitesCount: 1,
        keyObservationsPreview: [],
        dynamicSitesPreview: [],
        extractionStartedAt: '2026-01-01T00:00:00.000Z',
        computedAt: '2026-01-01T00:00:00.000Z',
      },
    };

    alignArchiveSnapshotTimings({
      snapshot,
      requestReceivedAt: '2026-01-01T00:00:00.000Z',
      prepareMeta: { prepareHost: 'worker-archive', zipParsedMs: 5, extractionMs: 0, totalMs: 105 },
    });

    expect(snapshot.uploadedAt).toBe('2026-01-01T00:00:00.005Z');
    expect(snapshot.extraction?.computedAt).toBe('2026-01-01T00:00:00.105Z');
  });
});
