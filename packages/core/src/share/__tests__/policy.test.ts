import { describe, expect, it } from 'vitest';
import type { ShareCacheEntry } from '../../types/share/entry.js';
import { findMatchingProjectShareEntry, normalizeWorkerBaseUrl, projectPayloadMatchesCachedEntry } from '../policy.js';

describe('share policy', () => {
  it('normalizeWorkerBaseUrl trims trailing slashes', () => {
    expect(normalizeWorkerBaseUrl('https://x.test/')).toBe('https://x.test');
  });

  it('findMatchingProjectShareEntry returns newest lastUsedAt', () => {
    const entries: ShareCacheEntry[] = [
      {
        kind: 'project',
        workerBaseUrl: 'https://w.test',
        workerProjectId: 'aaa',
        payloadContentHash: 'h1',
        configHash: 'c1',
        byteSize: 1,
        uploadedAt: '2020-01-01T00:00:00.000Z',
        lastUsedAt: '2020-01-01T00:00:00.000Z',
        links: {},
      },
      {
        kind: 'project',
        workerBaseUrl: 'https://w.test/',
        workerProjectId: 'bbb',
        payloadContentHash: 'h1',
        configHash: 'c1',
        byteSize: 2,
        uploadedAt: '2020-01-02T00:00:00.000Z',
        lastUsedAt: '2020-01-03T00:00:00.000Z',
        links: {},
      },
    ];
    const hit = findMatchingProjectShareEntry(entries, 'https://w.test', 'h1', 'c1');
    expect(hit?.workerProjectId).toBe('bbb');
  });

  it('projectPayloadMatchesCachedEntry respects optional stored configHash', () => {
    const e: ShareCacheEntry = {
      kind: 'project',
      workerBaseUrl: 'https://w',
      workerProjectId: 'x',
      payloadContentHash: 'p',
      byteSize: 1,
      uploadedAt: 't',
      lastUsedAt: 't',
      links: {},
    };
    expect(projectPayloadMatchesCachedEntry(e, 'p', 'any')).toBe(true);
    const e2: ShareCacheEntry = { ...e, configHash: 'c' };
    expect(projectPayloadMatchesCachedEntry(e2, 'p', 'c')).toBe(true);
    expect(projectPayloadMatchesCachedEntry(e2, 'p', 'd')).toBe(false);
  });
});
