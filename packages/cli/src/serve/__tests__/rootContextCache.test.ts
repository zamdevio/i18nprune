import { describe, expect, it, vi } from 'vitest';
import { RootContextCache } from '@/serve/rootContextCache.js';
import type { Context } from '@/types/core/context/index.js';

const host = { run: {} as Context['run'], cliOverrides: {} };

function fakeContext(root: string): Context {
  return { paths: { sourceLocale: root } } as unknown as Context;
}

describe('RootContextCache', () => {
  it('resolves each root once and returns the cached context thereafter', async () => {
    const resolve = vi.fn(async (root: string) => fakeContext(root));
    const cache = new RootContextCache(host, 8, 60_000, resolve);

    const a1 = await cache.get('/a');
    const a2 = await cache.get('/a');
    expect(a1).toBe(a2);
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(resolve).toHaveBeenCalledWith('/a', { ...host, cacheReadOnly: true });
  });

  it('keeps distinct roots separate (no cross-contamination)', async () => {
    const resolve = vi.fn(async (root: string) => fakeContext(root));
    const cache = new RootContextCache(host, 8, 60_000, resolve);
    expect((await cache.get('/a')).paths.sourceLocale).toBe('/a');
    expect((await cache.get('/b')).paths.sourceLocale).toBe('/b');
    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it('evicts the least-recently-used root past the cap', async () => {
    const resolve = vi.fn(async (root: string) => fakeContext(root));
    const cache = new RootContextCache(host, 2, 60_000, resolve);
    await cache.get('/a');
    await cache.get('/b');
    await cache.get('/a'); // touch /a so /b is now LRU
    await cache.get('/c'); // evicts /b
    expect(cache.size).toBe(2);

    await cache.get('/b'); // re-resolves (was evicted)
    expect(resolve.mock.calls.filter((c) => c[0] === '/b')).toHaveLength(2);
  });

  it('invalidate drops one root so the next get re-resolves', async () => {
    const resolve = vi.fn(async (root: string) => fakeContext(root));
    const cache = new RootContextCache(host, 8, 60_000, resolve);
    await cache.get('/a');
    cache.invalidate('/a');
    await cache.get('/a');
    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it('does not cache a rejected resolution (transient failure is retryable)', async () => {
    let attempt = 0;
    const resolve = vi.fn(async (root: string) => {
      attempt += 1;
      if (attempt === 1) throw new Error('boom');
      return fakeContext(root);
    });
    const cache = new RootContextCache(host, 8, 60_000, resolve);
    await expect(cache.get('/a')).rejects.toThrow('boom');
    // Allow the rejection handler on the cached promise to run.
    await Promise.resolve();
    await expect(cache.get('/a')).resolves.toBeDefined();
    expect(attempt).toBe(2);
  });

  it('keys on cache posture: read-only and write-enabled never share a context', async () => {
    const resolve = vi.fn(async (root: string, h: { cacheReadOnly: boolean }) =>
      ({ paths: { sourceLocale: `${root}:${h.cacheReadOnly ? 'ro' : 'rw'}` } }) as unknown as Context,
    );
    const cache = new RootContextCache(host, 8, 60_000, resolve);
    const ro = await cache.get('/a', true);
    const rw = await cache.get('/a', false);
    expect(ro).not.toBe(rw);
    expect(resolve).toHaveBeenCalledTimes(2);
    // Re-fetch each posture: cached, no extra resolves.
    await cache.get('/a', true);
    await cache.get('/a', false);
    expect(resolve).toHaveBeenCalledTimes(2);
    // A write invalidates both postures for that root.
    cache.invalidate('/a');
    await cache.get('/a', true);
    expect(resolve).toHaveBeenCalledTimes(3);
  });

  it('passes cacheReadOnly through to the resolver', async () => {
    const resolve = vi.fn(async (root: string) => fakeContext(root));
    const cache = new RootContextCache(host, 8, 60_000, resolve);
    await cache.get('/a', false);
    expect(resolve).toHaveBeenCalledWith('/a', { ...host, cacheReadOnly: false });
  });
});
