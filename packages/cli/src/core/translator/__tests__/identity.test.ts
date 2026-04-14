import { describe, expect, it } from 'vitest';
import {
  isIdentityTranslation,
  nextIdentityStreakState,
  buildIdentityStreakIssue,
} from '@/core/translator/identity.js';

describe('identity streak helpers', () => {
  it('treats normalized equivalent strings as identity', () => {
    expect(isIdentityTranslation('Hello   world', ' hello world ')).toBe(true);
  });

  it('increments and resets streak state', () => {
    const s1 = nextIdentityStreakState(
      { consecutiveIdentity: 0, lastPath: '' },
      { sourceText: 'A', translatedText: 'A', path: 'a.b' },
    );
    expect(s1.consecutiveIdentity).toBe(1);
    const s2 = nextIdentityStreakState(s1, {
      sourceText: 'A',
      translatedText: 'B',
      path: 'a.c',
    });
    expect(s2.consecutiveIdentity).toBe(0);
    expect(s2.lastPath).toBe('a.c');
  });

  it('builds stable issue code payload', () => {
    const i = buildIdentityStreakIssue({
      severity: 'error',
      target: 'fr',
      count: 8,
      path: 'home.title',
    });
    expect(i.code).toBe('i18nprune.translate.identity_streak_abort');
    expect(i.docPath).toBe('json/issue-codes');
  });
});
