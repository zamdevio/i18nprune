import { describe, it, expect, vi } from 'vitest';
import { translateFillCandidateLeaves } from '../translateCandidateLeaves.js';
import type { ReviewLeafRow } from '../../review/collectReviewLeaves.js';
import type { Translator } from '../../types/translator/index.js';
import type { EffectiveReferenceConfig } from '../../types/reference/index.js';

const eff: EffectiveReferenceConfig = {
  treatCommentedCallSitesAsRuntime: false,
  treatNonSourceFileSitesAsRuntime: false,
  uncertainKeyPolicy: 'allow',
  stringPresence: 'off',
  stringPresenceMaxHitsPerKey: 5,
  respectPreserve: false,
};

describe('translateFillCandidateLeaves', () => {
  it('increments changed for dry-run on every candidate leaf', async () => {
    const tLeaves: ReviewLeafRow[] = [{ path: 'a', value: 'same', shape: 'legacy_string', confidence: null, needsReview: null }];
    const sourceMap = new Map<string, string>([['a', 'same']]);
    const provider = { translate: vi.fn() } as unknown as Translator;
    const out = await translateFillCandidateLeaves({
      tLeaves,
      next: { a: 'same' },
      sourceMap,
      refCtx: { uncertainPrefixes: [] },
      eff,
      provider,
      providerId: 'google',
      persistStructuredLeafMetadata: false,
      target: 'fr',
      dryRun: true,
      tickProgress: () => {},
    });
    expect(out.changed).toBe(1);
    expect(provider.translate).not.toHaveBeenCalled();
  });

  it('uses phase parallel_pool tickProgress during parallel translate pool', async () => {
    const tLeaves: ReviewLeafRow[] = [
      { path: 'a', value: 'x', shape: 'legacy_string', confidence: null, needsReview: null },
      { path: 'b', value: 'y', shape: 'legacy_string', confidence: null, needsReview: null },
    ];
    const sourceMap = new Map<string, string>([
      ['a', 'x'],
      ['b', 'y'],
    ]);
    const calls: { phase?: string }[] = [];
    const tickProgress = vi.fn((_i: number, _t: number, _p: string, opts?: { phase?: string }) => {
      calls.push({ phase: opts?.phase });
    });
    const provider = {
      translate: vi.fn(async (text: string) => `${text}-fr`),
    } as unknown as Translator;
    await translateFillCandidateLeaves({
      tLeaves,
      next: { a: 'x', b: 'y' },
      sourceMap,
      refCtx: { uncertainPrefixes: [] },
      eff,
      provider,
      providerId: 'google',
      persistStructuredLeafMetadata: false,
      target: 'fr',
      dryRun: false,
      maxParallelTranslates: 2,
      tickProgress,
    });
    expect(provider.translate).toHaveBeenCalledTimes(2);
    const poolTicks = calls.filter((c) => c.phase === 'parallel_pool');
    expect(poolTicks.length).toBeGreaterThanOrEqual(2);
  });
});
