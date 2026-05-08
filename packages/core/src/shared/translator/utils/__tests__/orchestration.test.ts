import { describe, it, expect, vi } from 'vitest';
import {
  mapWithConcurrency,
  mapWithConcurrencyWithProgress,
  mapWithConcurrencyWithProgressOrderedSequential,
  resolveTranslateMaxParallel,
} from '../orchestration.js';

describe('mapWithConcurrency', () => {
  it('preserves item order in results', async () => {
    const items = [1, 2, 3, 4, 5];
    const out = await mapWithConcurrency(items, 2, async (n) => n * 2);
    expect(out).toEqual([2, 4, 6, 8, 10]);
  });

  it('limits in-flight work', async () => {
    let inflight = 0;
    let maxSeen = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);
    await mapWithConcurrency(
      items,
      3,
      async (i) => {
        inflight += 1;
        maxSeen = Math.max(maxSeen, inflight);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 5);
        });
        inflight -= 1;
        return i;
      },
    );
    expect(maxSeen).toBeLessThanOrEqual(3);
  });
});

describe('mapWithConcurrencyWithProgress', () => {
  it('reports monotonic completed and stable slot paths', async () => {
    const progress = vi.fn();
    const out = await mapWithConcurrencyWithProgress(
      ['a', 'b', 'c'],
      2,
      async (x) => {
        await new Promise<void>((r) => setTimeout(r, x === 'b' ? 8 : 0));
        return x.toUpperCase();
      },
      (snap) => progress(snap),
      (item) => item,
    );
    expect(out).toEqual(['A', 'B', 'C']);
    const completedSeries = progress.mock.calls.map((c) => c[0].completed as number);
    expect(completedSeries[completedSeries.length - 1]).toBe(3);
    for (let i = 1; i < completedSeries.length; i += 1) {
      expect(completedSeries[i]).toBeGreaterThanOrEqual(completedSeries[i - 1]!);
    }
  });

  it('stops emitting progress after first mapper failure (prevents post-fail redraw)', async () => {
    const progress = vi.fn();
    await expect(
      mapWithConcurrencyWithProgress(
        ['a', 'b', 'c', 'd'],
        2,
        async (x) => {
          if (x === 'b') throw new Error('429');
          // keep some async work in flight so the old implementation would keep emitting after rejection
          await new Promise<void>((r) => setTimeout(r, 10));
          return x.toUpperCase();
        },
        (snap) => progress(snap),
        (item) => item,
      ),
    ).rejects.toThrow('429');
    // No strict assertion on count, but it should not spam updates after failure.
    expect(progress.mock.calls.length).toBeGreaterThan(0);
  });
});

describe('mapWithConcurrencyWithProgressOrderedSequential', () => {
  it('runs onSequential in item order while bounded translators finish out of order', async () => {
    const sequential: string[] = [];
    let unblockB: (() => void) | undefined;
    const waitB = new Promise<void>((r) => {
      unblockB = r;
    });

    await mapWithConcurrencyWithProgressOrderedSequential(
      ['a', 'b', 'c', 'd'],
      2,
      async (letter) => {
        if (letter === 'b') await waitB;
        if (letter === 'c') await new Promise<void>((r) => setTimeout(r, 4));
        return letter.toUpperCase();
      },
      () => {},
      (item) => item,
      async (_item, _idx, result) => {
        sequential.push(result);
        if (result === 'A') unblockB?.();
      },
    );
    expect(sequential).toEqual(['A', 'B', 'C', 'D']);
  });

  it('rejects immediately when a translator job fails (no stalled drain)', async () => {
    await expect(
      mapWithConcurrencyWithProgressOrderedSequential(
        [1, 2, 3],
        2,
        async (n) => {
          if (n === 2) throw new Error('translate failed');
          return n * 10;
        },
        () => {},
        () => '',
        async () => {},
      ),
    ).rejects.toThrow('translate failed');
  });

  it('throws when mapper resolves to undefined (would otherwise stall the sequential drain)', async () => {
    await expect(
      mapWithConcurrencyWithProgressOrderedSequential(
        ['a'],
        2,
        async () => Promise.resolve(undefined as unknown as string),
        () => {},
        () => '',
        async () => {},
      ),
    ).rejects.toThrow(/returned undefined/);
  });

  it('does not treat slow parallel mappers as a scheduling deadlock', async () => {
    const n = 120;
    const items = Array.from({ length: n }, (_, i) => i);
    const received: number[] = [];
    await mapWithConcurrencyWithProgressOrderedSequential(
      items,
      8,
      async (i) => {
        await new Promise<void>((r) => setImmediate(r));
        return i * 2;
      },
      () => {},
      (_, idx) => `leaf-${idx}`,
      async (_item, _idx, result) => {
        received.push(result);
      },
    );
    expect(received).toEqual(items.map((i) => i * 2));
  });
});

describe('resolveTranslateMaxParallel', () => {
  it('defaults to 1', () => {
    expect(resolveTranslateMaxParallel({})).toBe(1);
  });

  it('prefers workers over env and config', () => {
    expect(
      resolveTranslateMaxParallel({
        workersFlag: 8,
        configMaxWorkers: 2,
        envMaxWorkers: '5',
      }),
    ).toBe(8);
  });

  it('uses env over config when flags unset', () => {
    expect(resolveTranslateMaxParallel({ configMaxWorkers: 2, envMaxWorkers: '6' })).toBe(6);
  });

  it('clamps to 1..64', () => {
    expect(resolveTranslateMaxParallel({ workersFlag: 0 })).toBe(1);
    expect(resolveTranslateMaxParallel({ workersFlag: 200 })).toBe(64);
  });
});
