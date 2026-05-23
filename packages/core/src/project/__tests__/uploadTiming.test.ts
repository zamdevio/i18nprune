import { describe, expect, it } from 'vitest';
import { buildProjectUploadSnapshotMeta } from '../uploadTiming.js';
import type { ProjectSnapshot } from '../../types/project/upload.js';
import type { ProjectStoreRow } from '../../types/project/store.js';
import { METADATA_DASH } from '../../types/project/metadata.js';

function baseSnapshot(overrides: Partial<ProjectSnapshot> = {}): ProjectSnapshot {
  return {
    projectId: 'abc',
    projectHash: 'hash',
    requestReceivedAt: '2026-01-01T00:00:00.000Z',
    preparedAt: '2026-01-01T00:00:00.050Z',
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

function baseRow(overrides: Partial<ProjectStoreRow> = {}): ProjectStoreRow {
  return {
    projectId: 'abc',
    projectHash: 'hash',
    snapshot: baseSnapshot(),
    ingestRoute: 'prepared',
    prepareMeta: {
      prepareHost: 'cli-share',
      zipParsedMs: 10,
      analysisMs: 20,
      extractionMs: 700,
      totalMs: 1000,
    },
    processorContext: {
      toolVersion: '0.1.0',
      environment: {
        platform: 'linux',
        arch: 'x64',
        nodeVersion: 'v20.0.0',
        osRelease: '6.6',
        runtimeFamily: 'linux',
      },
    },
    ...overrides,
  };
}

describe('buildProjectUploadSnapshotMeta', () => {
  it('returns timing block with ms and ISO values', () => {
    const meta = buildProjectUploadSnapshotMeta(baseRow());
    expect(meta.timing.prepare.extractionMs).toBe(700);
    expect(meta.timing.edge.persistMs).toBe(200);
    expect('totalMs' in meta.timing.edge).toBe(false);
    expect(meta.timing.extraction.startedAt).toBe('2026-01-01T00:00:00.100Z');
    expect(meta.processor.surface).toBe('cli');
    expect(meta.processor.route).toBe('prepared');
    expect(meta.processor.sdk).toBe('i18nprune-cli');
    expect(meta.processor.sdkVersion).toBe('0.1.0');
    expect(meta.extraction?.cache.projectCacheEnabled).toBe(false);
  });

  it('surfaces custom SDK processor and cache meta from prepare', () => {
    const meta = buildProjectUploadSnapshotMeta(
      baseRow({
        processorContext: {
          surface: 'acme-ci',
          surfaceLabel: 'Acme CI',
          route: 'nightly-upload',
          routeLabel: 'Nightly snapshot',
          sdk: 'acme-i18n-sdk',
          toolVersion: '2.0.0',
        },
        prepareMeta: {
          prepareHost: 'acme-ci',
          totalMs: 50,
          analysisMs: 0,
          hostCache: {
            analysis: 'hit',
            analysisReason: 'cache_hit',
            timingsTrustworthy: false,
            filesEpoch: 'epoch-abc',
            projectCacheEnabled: true,
          },
        },
      }),
    );
    expect(meta.processor.surface).toBe('acme-ci');
    expect(meta.processor.surfaceLabel).toBe('Acme CI');
    expect(meta.processor.route).toBe('nightly-upload');
    expect(meta.processor.sdk).toBe('acme-i18n-sdk');
    expect(meta.processor.sdkVersion).toBe('0.1.0');
    expect(meta.extraction?.cache.analysis).toBe('hit');
    expect(meta.extraction?.cache.timingsTrustworthy).toBe(false);
    expect(meta.extraction?.cache.filesEpoch).toBe('epoch-abc');
  });

  it('prefers measured persistMs on prepareMeta over ISO delta', () => {
    const meta = buildProjectUploadSnapshotMeta(
      baseRow({ prepareMeta: { prepareHost: 'worker-archive', persistMs: 42, totalMs: 900 } }),
    );
    expect(meta.timing.edge.persistMs).toBe(42);
  });

  it('falls back to ISO persist delta when measured persistMs is zero', () => {
    const meta = buildProjectUploadSnapshotMeta(
      baseRow({ prepareMeta: { prepareHost: 'worker-archive', persistMs: 0 } }),
    );
    expect(meta.timing.edge.persistMs).toBe(200);
  });

  it('uses dash for invalid or missing timestamps', () => {
    const meta = buildProjectUploadSnapshotMeta(
      baseRow({
        snapshot: baseSnapshot({
          requestReceivedAt: undefined,
          storedAt: undefined,
          extraction: {
            ...baseSnapshot().extraction!,
            extractionStartedAt: undefined,
            computedAt: 'not-a-date',
          },
        }),
        prepareMeta: { prepareHost: 'cli-share' },
      }),
    );
    expect(meta.timing.requestReceivedAt).toBe('2026-01-01T00:00:00.050Z');
    expect(meta.timing.extraction.startedAt).toBe('2026-01-01T00:00:00.050Z');
    expect(meta.timing.extraction.computedAt).toBe(METADATA_DASH);
    expect(meta.timing.prepare.zipParsedMs).toBe(METADATA_DASH);
  });
});
