import { describe, expect, it } from 'vitest';
import type { GitHubUserProfile } from '../api.js';
import { GitHubProfileCache, GITHUB_PROFILE_TTL_MS } from '../cache.js';

const profile: GitHubUserProfile = {
  login: 'alice',
  html_url: 'https://github.com/alice',
  avatar_url: 'https://avatars.githubusercontent.com/u/1',
  name: 'Alice',
  bio: 'builder',
  followers: 10,
  following: 2,
};

describe('GitHubProfileCache', () => {
  it('returns fresh enriched entries within TTL', () => {
    const cache = GitHubProfileCache.empty();
    cache.setEnriched('alice', profile);
    expect(cache.getFreshEnriched('alice', false)?.profile?.login).toBe('alice');
  });

  it('treats expired enriched entries as stale for refresh but keeps sticky copy', () => {
    const cache = GitHubProfileCache.empty();
    const staleAt = new Date(Date.now() - GITHUB_PROFILE_TTL_MS - 60_000).toISOString();
    (cache as unknown as { entries: Record<string, unknown> }).entries = {
      alice: {
        login: 'alice',
        status: 'enriched',
        fetchedAt: staleAt,
        profile,
      },
    };
    expect(cache.getFreshEnriched('alice', false)).toBeUndefined();
    expect(cache.getStickyEnriched('alice')?.profile?.login).toBe('alice');
  });

  it('does not let not_found overwrite enriched entries', () => {
    const cache = GitHubProfileCache.empty();
    cache.setEnriched('alice', profile);
    cache.setNotFound('alice');
    expect(cache.getStickyEnriched('alice')?.profile?.login).toBe('alice');
  });

  it('caches not_found separately when no enriched entry exists', () => {
    const cache = GitHubProfileCache.empty();
    cache.setNotFound('ghost');
    expect(cache.getFreshNotFound('ghost', false)?.status).toBe('not_found');
  });
});
