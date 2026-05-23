import { describe, expect, it } from 'vitest';
import { buildProjectStoredMetadata } from '../storedMetadata.js';
import type { ProjectStoreRow } from '../../types/project/store.js';

describe('buildProjectStoredMetadata timing fallbacks', () => {
  it('uses ISO deltas when prepareMeta ms are zero', () => {
    const row: ProjectStoreRow = {
      projectId: 'p1',
      projectHash: 'h1',
      ingestRoute: 'archive',
      prepareMeta: { prepareHost: 'worker-archive', zipParsedMs: 0, extractionMs: 0, totalMs: 0, persistMs: 0 },
      snapshot: {
        projectId: 'p1',
        projectHash: 'h1',
        requestReceivedAt: '2026-01-01T00:00:00.000Z',
        preparedAt: '2026-01-01T00:00:00.010Z',
        storedAt: '2026-01-01T00:00:01.000Z',
        zipBytes: 1,
        fileCount: 1,
        textFileCount: 1,
        detectedConfigPath: null,
        detectedConfigRaw: null,
        tree: [],
        resolvedConfig: null,
        sourceLocaleJson: { a: 'A' },
        localeJsonByTag: {},
        extraction: {
          configHash: 'c',
          sourceLocalePath: 'locales/en.json',
          srcRoot: 'src',
          localesDir: 'locales',
          resolvedKeys: [],
          keyObservationsCount: 1,
          dynamicSitesCount: 0,
          keyObservationsPreview: [],
          dynamicSitesPreview: [],
          extractionStartedAt: '2026-01-01T00:00:00.010Z',
          computedAt: '2026-01-01T00:00:00.900Z',
        },
      },
    };
    const meta = buildProjectStoredMetadata(row);
    expect(meta.timing.prepare.zipParsedMs).toBe(10);
    expect(meta.timing.prepare.totalMs).toBe(900);
    expect(meta.timing.prepare.extractionMs).toBe(890);
    expect(meta.timing.edge.persistMs).toBe(100);
    expect(meta.localeTags).toEqual([]);
  });

  it('reads legacy snapshot uploadedAt as preparedAt', () => {
    const legacySnapshot = {
      projectId: 'p1',
      projectHash: 'h1',
      uploadedAt: '2026-02-01T12:00:00.000Z',
      zipBytes: 1,
      fileCount: 1,
      textFileCount: 1,
      detectedConfigPath: null,
      detectedConfigRaw: null,
      tree: [],
      resolvedConfig: null,
      sourceLocaleJson: null,
      localeJsonByTag: {},
      extraction: null,
    } as unknown as ProjectStoreRow['snapshot'];
    const row: ProjectStoreRow = {
      projectId: 'p1',
      projectHash: 'h1',
      ingestRoute: 'prepared',
      snapshot: legacySnapshot,
    };
    const meta = buildProjectStoredMetadata(row);
    expect(meta.preparedAt).toBe('2026-02-01T12:00:00.000Z');
    expect(meta.timing.preparedAt).toBe('2026-02-01T12:00:00.000Z');
  });
});
