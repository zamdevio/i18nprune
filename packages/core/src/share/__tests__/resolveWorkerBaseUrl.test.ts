import { describe, expect, it } from 'vitest';
import { DEFAULT_WORKER_API_URL } from '../../shared/constants/links.js';
import { resolveShareWorkerBaseUrl } from '../resolveWorkerBaseUrl.js';

describe('resolveShareWorkerBaseUrl', () => {
  it('normalizes host-supplied URL or uses production default', () => {
    expect(resolveShareWorkerBaseUrl('https://custom.test/')).toBe('https://custom.test');
    expect(resolveShareWorkerBaseUrl()).toBe(DEFAULT_WORKER_API_URL);
    expect(resolveShareWorkerBaseUrl('   ')).toBe(DEFAULT_WORKER_API_URL);
  });
});
