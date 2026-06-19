import { describe, expect, it } from 'vitest';
import { pickPrimaryBranch, resolveDefaultBranch, type ExclusiveCommitMap } from '../branches.js';

describe('resolveDefaultBranch', () => {
  it('prefers main over feature branches', () => {
    expect(resolveDefaultBranch(['feat/studio', 'main'])).toBe('main');
  });
});

describe('pickPrimaryBranch', () => {
  const exclusive: ExclusiveCommitMap = new Map([
    ['feat/studio', new Set(['10725cb00000000000000000000000000000000'])],
  ]);

  it('assigns exclusive commits to the feature branch', () => {
    expect(
      pickPrimaryBranch(
        '10725cb00000000000000000000000000000000',
        ['feat/studio', 'main'],
        exclusive,
        'main',
      ),
    ).toBe('feat/studio');
  });

  it('assigns shared history to main when both branches contain the commit', () => {
    expect(pickPrimaryBranch('abc123', ['feat/studio', 'main'], exclusive, 'main')).toBe('main');
  });

  it('returns the only branch when there is no overlap', () => {
    expect(pickPrimaryBranch('abc123', ['feat/other'], exclusive, 'main')).toBe('feat/other');
  });
});
