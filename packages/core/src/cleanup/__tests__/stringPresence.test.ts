import { describe, expect, it } from 'vitest';
import { resolveCleanupKeysWithStringPresencePolicy } from '../stringPresence.js';

describe('cleanup stringPresence policy', () => {
  const leaves = [{ path: 'home.title', value: 'Home' }];

  it('guard mode skips removal when presence is found', () => {
    const out = resolveCleanupKeysWithStringPresencePolicy({
      candidates: ['home.title'],
      leaves,
      stringPresence: 'guard',
      stringPresenceMaxHitsPerKey: 3,
      skipStringPresenceCheck: false,
      stringPresenceAvailable: true,
      hasStringPresence: () => true,
      getStringPresenceLocations: () => ['src/a.ts:10'],
    });
    expect(out.safeToRemove).toEqual([]);
    expect(out.evidence).toEqual([
      { key: 'home.title', kind: 'guard_skipped', locations: ['src/a.ts:10'] },
    ]);
  });

  it('warn mode keeps removal but records evidence', () => {
    const out = resolveCleanupKeysWithStringPresencePolicy({
      candidates: ['home.title'],
      leaves,
      stringPresence: 'warn',
      stringPresenceMaxHitsPerKey: 2,
      skipStringPresenceCheck: false,
      stringPresenceAvailable: true,
      hasStringPresence: () => true,
      getStringPresenceLocations: () => ['src/b.ts:20'],
    });
    expect(out.safeToRemove).toEqual(['home.title']);
    expect(out.evidence).toEqual([
      { key: 'home.title', kind: 'warn_hit', locations: ['src/b.ts:20'] },
    ]);
  });
});
