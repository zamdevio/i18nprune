import { describe, expect, it } from 'vitest';
import { pickEvictionTargets, rankEvictionCandidates, type EvictionCandidate } from '../eviction.js';

describe('pickEvictionTargets', () => {
  const candidates: EvictionCandidate[] = [
    { kind: 'project', rowKey: 'project:a', hashKey: 'projecthash:1', lastAccessedMs: 100, sizeBytes: 50 },
    { kind: 'project', rowKey: 'project:b', hashKey: 'projecthash:2', lastAccessedMs: 100, sizeBytes: 500 },
    { kind: 'report', rowKey: 'report:c', hashKey: 'reporthash:3', lastAccessedMs: 50, sizeBytes: 10 },
    { kind: 'report', rowKey: 'report:d', hashKey: 'reporthash:4', lastAccessedMs: 200, sizeBytes: 20 },
  ];

  it('prefers oldest rows and larger size among ties', () => {
    const ranked = rankEvictionCandidates(candidates);
    expect(ranked[0]?.rowKey).toBe('report:c');
    expect(ranked[1]?.rowKey).toBe('project:b');
    expect(ranked[2]?.rowKey).toBe('project:a');
  });

  it('deletes about 25% of combined rows (at least one)', () => {
    const picked = pickEvictionTargets(candidates, 0.25);
    expect(picked).toHaveLength(1);
    expect(picked[0]?.rowKey).toBe('report:c');
  });
});
