import { describe, expect, it, vi } from 'vitest';
import { createFillTickProgressRelay, createGenerateTickProgressRelay } from '../tickRelay.js';

const translationMeta = { providerId: 'google' as const, translationModel: undefined };

describe('createGenerateTickProgressRelay', () => {
  it('calls underlying tick every time but emits JSON only at 1, every 50, and total', () => {
    const tick = vi.fn();
    const emit = vi.fn();
    const relay = createGenerateTickProgressRelay({
      tick,
      emit,
      runId: 'r1',
      target: 'ja',
      translationMeta,
    });
    const total = 120;
    for (let i = 1; i <= total; i++) relay(i, total, 'k', undefined);
    expect(tick).toHaveBeenCalledTimes(120);
    const progressCalls = emit.mock.calls.map((c) => c[0]).filter((e) => e.type === 'run.progress.generate');
    expect(progressCalls.map((e: { current?: number }) => e.current)).toEqual([1, 50, 100, 120]);
  });

  it('does not call emit when emit is omitted', () => {
    const tick = vi.fn();
    const relay = createGenerateTickProgressRelay({
      tick,
      target: 'ja',
      translationMeta,
    });
    relay(1, 10, 'x', undefined);
    relay(10, 10, 'y', undefined);
    expect(tick).toHaveBeenCalledTimes(2);
  });
});

describe('createFillTickProgressRelay', () => {
  it('mirrors generate throttle for run.progress.fill translate phase', () => {
    const tick = vi.fn();
    const emit = vi.fn();
    const relay = createFillTickProgressRelay({
      tick,
      emit,
      runId: 'r2',
      target: 'de',
      translationMeta,
    });
    const total = 55;
    for (let i = 1; i <= total; i++) relay(i, total, `path.${String(i)}`, undefined);
    expect(tick).toHaveBeenCalledTimes(55);
    const fills = emit.mock.calls.map((c) => c[0]).filter((e) => e.type === 'run.progress.fill');
    expect(fills.every((e: { phase?: string }) => e.phase === 'translate')).toBe(true);
    expect(fills.map((e: { current?: number; op?: string }) => [e.op, e.current])).toEqual([
      ['fill', 1],
      ['fill', 50],
      ['fill', 55],
    ]);
  });
});
