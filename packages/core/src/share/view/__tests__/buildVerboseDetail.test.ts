import { describe, expect, it } from 'vitest';
import { buildShareViewVerboseDetail } from '../buildVerboseDetail.js';
import type { ShareViewResult } from '../../../types/share/shareRun.js';
import type { ProjectStoredMetadata } from '../../../types/project/metadata.js';

function projectView(overrides?: Partial<ShareViewResult>): ShareViewResult {
  const meta: ProjectStoredMetadata = {
    projectId: 'p1',
    projectHash: 'abcdef1234567890',
    uploadedAt: '2026-01-01T00:00:00.000Z',
    zipBytes: 100,
    fileCount: 2,
    textFileCount: 2,
    detectedConfigPath: 'i18nprune.config.json',
    localeTags: ['en'],
    expiresAt: '2026-01-08T00:00:00.000Z',
    timing: {
      requestReceivedAt: '2026-01-01T00:00:00.000Z',
      uploadedAt: '2026-01-01T00:00:00.000Z',
      storedAt: '2026-01-01T00:00:01.000Z',
      lastAccessedAt: '2026-01-01T00:00:01.000Z',
      prepare: { zipParsedMs: 72, analysisMs: 48, extractionMs: 22, totalMs: 153 },
      extraction: {
        startedAt: '2026-01-01T00:00:00.100Z',
        computedAt: '2026-01-01T00:00:00.500Z',
        durationMs: 400,
      },
      edge: { persistMs: 1866 },
    },
    processor: {
      surface: 'cli',
      surfaceLabel: 'i18nprune CLI',
      route: 'prepared',
      routeLabel: 'Prepared JSON ingest',
      prepareHost: 'cli-share',
      toolVersion: '0.1.0',
      sdk: 'i18nprune-cli',
      sdkVersion: '0.1.0',
      prepareSummary: 'Prepared on disk',
      environment: {
        platform: 'linux',
        arch: 'x64',
        nodeVersion: 'v20.20.0',
        osRelease: '6.6.87',
        runtimeFamily: 'linux-wsl',
      },
    },
    extraction: {
      configHash: 'cfgcfgcfgcfg',
      sourceLocalePath: 'locales/en.json',
      srcRoot: 'src',
      localesDir: 'locales',
      keyObservationsCount: 1177,
      dynamicSitesCount: 88,
      cache: {
        analysis: 'hit',
        analysisReason: 'cache_hit',
        timingsTrustworthy: false,
        filesEpoch: 'fbd828fbd828fbd828',
        projectCacheEnabled: true,
      },
    },
  };
  return {
    kind: 'project',
    workerId: 'p1',
    remoteMetadata: meta,
    links: { web: 'https://web.i18nprune.dev/#/workspace?id=p1' },
    issues: [],
    ...overrides,
  };
}

describe('buildShareViewVerboseDetail', () => {
  it('builds processor, extraction, cache, and timing sections', () => {
    const verbose = buildShareViewVerboseDetail(projectView());
    expect(verbose?.kind).toBe('project');
    expect(verbose?.processor.surface).toBe('cli');
    expect(verbose?.processor.route).toBe('prepared');
    expect(verbose?.processor.node).toBe('v20.20.0');
    expect(verbose?.extraction?.observations).toBe(1177);
    expect(verbose?.cache?.analysis).toBe('hit');
    expect(verbose?.cache?.timingsTrustworthy).toBe(false);
    expect(verbose?.timings?.['prepare.totalMs']).toBe('153');
    expect(verbose?.edge?.persistMs).toBe('1866');
    expect(String(verbose?.cache?.filesEpoch)).toMatch(/…$/);
    expect(String(verbose?.snapshot?.projectHash)).toMatch(/…$/);
  });

  it('falls back to minimal sections when metadata parse is missing', () => {
    const verbose = buildShareViewVerboseDetail({
      kind: 'project',
      workerId: 'p2',
      remote: { fileCount: 3, zipBytes: 50, projectHash: 'ab', timing: { edge: { persistMs: 1 } } },
      links: {},
      issues: [],
    });
    expect(verbose?.processor.note).toContain('parse unavailable');
    expect(verbose?.snapshot?.fileCount).toBe('3');
  });
});
