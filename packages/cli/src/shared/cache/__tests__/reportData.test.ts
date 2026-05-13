import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context } from '@/types/core/context/index.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';
import { getOrBuildProjectReportWithCache } from '../dispatch.js';
import { refreshProjectReportCache, resolveProjectReportData } from '../reportData.js';

vi.mock('../dispatch.js', () => ({
  getOrBuildProjectReportWithCache: vi.fn(),
}));

const getOrBuildMock = vi.mocked(getOrBuildProjectReportWithCache);

function makeRun() {
  return {
    json: false,
    jsonPretty: true,
    quiet: false,
    silent: false,
    debugScan: false,
    debugCache: false,
  };
}

function makeContext(): Context {
  return {
    config: {} as Context['config'],
    paths: {
      sourceLocale: '/tmp/app/locales/en.json',
      localesDir: '/tmp/app/locales',
      srcRoot: '/tmp/app/src',
    },
    run: makeRun(),
    meta: {
      fieldSources: {},
      warnings: [],
      cache: {
        enabled: true,
        reason: 'default',
        rootDir: '/tmp/cache',
        metaPath: '/tmp/cache/meta.json',
        projectId: 'abc123',
        projectRoot: '/tmp/app',
        projectDir: '/tmp/cache/projects/abc123',
        filesPath: '/tmp/cache/projects/abc123/files.json',
        snapshotPath: '/tmp/cache/projects/abc123/snapshot.json',
        analysisPath: '/tmp/cache/projects/abc123/analysis.json',
        readOnly: false,
      },
    },
    adapters: {} as Context['adapters'],
  };
}

function makeDocument(id: string): ProjectReportDocument {
  return { id } as unknown as ProjectReportDocument;
}

describe('shared/cache/reportData', () => {
  beforeEach(() => {
    getOrBuildMock.mockReset();
  });

  it('memoizes project report data for repeated helpers in the same Context', () => {
    const ctx = makeContext();
    const document = makeDocument('first');
    getOrBuildMock.mockReturnValue({
      document,
      cache: { status: 'hit', reason: 'cache_hit', warnings: [] },
    });

    expect(resolveProjectReportData(ctx)).toEqual({ document, fromCache: true });
    expect(resolveProjectReportData(ctx)).toEqual({ document, fromCache: true });

    expect(getOrBuildMock).toHaveBeenCalledTimes(1);
  });

  it('logs same-run memory hits when cache debugging is enabled', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const ctx = makeContext();
      ctx.run.debugCache = true;
      const document = makeDocument('first');
      getOrBuildMock.mockReturnValue({
        document,
        cache: { status: 'hit', reason: 'cache_hit', warnings: [] },
      });

      resolveProjectReportData(ctx);
      resolveProjectReportData(ctx);

      expect(log.mock.calls.some((call) => String(call[0]).includes('project report cache memory hit (same_run)'))).toBe(true);
      expect(getOrBuildMock).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });

  it('replaces the memo after refreshProjectReportCache', () => {
    const ctx = makeContext();
    const first = makeDocument('first');
    const refreshed = makeDocument('refreshed');
    getOrBuildMock
      .mockReturnValueOnce({ document: first, cache: { status: 'hit', reason: 'cache_hit', warnings: [] } })
      .mockReturnValueOnce({ document: refreshed, cache: { status: 'miss', reason: 'files_changed', warnings: [] } });

    expect(resolveProjectReportData(ctx).document).toBe(first);
    refreshProjectReportCache(ctx);
    expect(resolveProjectReportData(ctx)).toEqual({ document: refreshed, fromCache: false });

    expect(getOrBuildMock).toHaveBeenCalledTimes(2);
  });
});
