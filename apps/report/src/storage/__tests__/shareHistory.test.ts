import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
};

vi.stubGlobal('localStorage', localStorageMock);
import { SHARE_HISTORY_DEFAULT_MAX, SHARE_HISTORY_HARD_MAX } from '../../constants/shareHistory.js';
import {
  clearShareHistory,
  exportShareHistoryBundle,
  importShareHistoryBundle,
  listShareHistory,
  recordShareHistory,
  validateShareHistoryExport,
} from '../shareHistory.js';
import { readReportSettings, writeReportSettings } from '../settings.js';

beforeEach(() => {
  localStorage.clear();
  writeReportSettings({ maxHistoryCount: SHARE_HISTORY_DEFAULT_MAX });
});

describe('shareHistory', () => {
  it('records and dedupes by reportId', () => {
    recordShareHistory({
      reportId: 'abc123def4567890',
      workerBaseUrl: 'https://worker.test',
      activity: 'viewed',
      toolVersion: '0.1.0',
    });
    recordShareHistory({
      reportId: 'abc123def4567890',
      workerBaseUrl: 'https://worker.test',
      activity: 'shared',
    });
    const list = listShareHistory();
    expect(list).toHaveLength(1);
    expect(list[0]?.activities).toEqual(expect.arrayContaining(['viewed', 'shared']));
  });

  it('evicts oldest when over max', () => {
    vi.useFakeTimers();
    writeReportSettings({ maxHistoryCount: 2 });
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    recordShareHistory({ reportId: 'aaaaaaaaaaaaaaaa', workerBaseUrl: 'https://w', activity: 'viewed' });
    vi.setSystemTime(new Date('2026-01-02T00:00:00Z'));
    recordShareHistory({ reportId: 'bbbbbbbbbbbbbbbb', workerBaseUrl: 'https://w', activity: 'viewed' });
    vi.setSystemTime(new Date('2026-01-03T00:00:00Z'));
    recordShareHistory({ reportId: 'cccccccccccccccc', workerBaseUrl: 'https://w', activity: 'viewed' });
    const ids = listShareHistory().map((e) => e.reportId);
    expect(ids).toHaveLength(2);
    expect(ids).not.toContain('aaaaaaaaaaaaaaaa');
    vi.useRealTimers();
  });

  it('clamps settings to hard max', () => {
    writeReportSettings({ maxHistoryCount: 50_000 });
    expect(readReportSettings().maxHistoryCount).toBe(SHARE_HISTORY_HARD_MAX);
  });

  it('round-trips export/import replace', () => {
    recordShareHistory({ reportId: 'abc123def4567890', workerBaseUrl: 'https://w', activity: 'shared' });
    const bundle = exportShareHistoryBundle();
    clearShareHistory();
    expect(listShareHistory()).toHaveLength(0);
    importShareHistoryBundle(validateShareHistoryExport(bundle), 'replace');
    expect(listShareHistory()).toHaveLength(1);
  });
});

afterEach(() => {
  vi.useRealTimers();
});
