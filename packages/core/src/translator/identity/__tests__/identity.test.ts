import { describe, expect, it } from 'vitest';
import {
  buildIdentityStreakIssue,
  createIdentityStreakGuard,
  IdentityAbortError,
  isIdentityTranslation,
  nextIdentityStreakState,
} from '../index.js';

describe('identity streak helpers', () => {
  it('treats normalized equivalent strings as identity', () => {
    expect(isIdentityTranslation('Hello   world', ' hello world ')).toBe(true);
  });

  it('never treats whitespace-only source as identical to translation (no streak)', () => {
    expect(isIdentityTranslation('', '')).toBe(false);
    expect(isIdentityTranslation(' ', ' ')).toBe(false);
    expect(isIdentityTranslation('\n\t', 'x')).toBe(false);
    expect(isIdentityTranslation('hello', '')).toBe(false);
    expect(isIdentityTranslation('hello', 'hello')).toBe(true);
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
    expect(i.docPath).toBe('issues/translate');
  });
});

describe('createIdentityStreakGuard (pure)', () => {
  async function feed(
    guard: ReturnType<typeof createIdentityStreakGuard>,
    n: number,
    sourceText = 'Hello',
  ): Promise<void> {
    for (let i = 0; i < n; i += 1) {
      await guard.onTranslated(sourceText, sourceText, `key.${String(i)}`);
    }
  }

  it('emits no issue and no abort below the threshold', async () => {
    const guard = createIdentityStreakGuard({ command: 'generate', target: 'fr' });
    await feed(guard, 7);
    expect(guard.flushIssues()).toEqual([]);
  });

  it('non-interactive (default): emits warning at every cap multiple, never aborts', async () => {
    const guard = createIdentityStreakGuard({ command: 'generate', target: 'fr' });
    await feed(guard, 16);
    const issues = guard.flushIssues();
    expect(issues).toHaveLength(2);
    expect(issues.every((i) => i.code === 'i18nprune.translate.identity_streak_warning')).toBe(true);
  });

  it('interactive without confirm callback: continues silently, still emits warnings', async () => {
    const guard = createIdentityStreakGuard({
      command: 'generate',
      target: 'fr',
      interactive: () => true,
    });
    await feed(guard, 16);
    expect(guard.flushIssues()).toHaveLength(2);
  });

  it('interactive + confirm returns false: aborts via IdentityAbortError', async () => {
    const calls: number[] = [];
    const guard = createIdentityStreakGuard({
      command: 'generate',
      target: 'fr',
      interactive: () => true,
      confirm: async (input) => {
        calls.push(input.count);
        return false;
      },
    });
    await expect(feed(guard, 8)).rejects.toBeInstanceOf(IdentityAbortError);
    expect(calls).toEqual([8]);
    expect(guard.flushIssues()).toHaveLength(1);
  });

  it('interactive + confirm returns true: re-prompts at next multiple of threshold', async () => {
    const calls: number[] = [];
    const guard = createIdentityStreakGuard({
      command: 'generate',
      target: 'fr',
      interactive: () => true,
      confirm: async (input) => {
        calls.push(input.count);
        return true;
      },
    });
    await feed(guard, 16);
    expect(calls).toEqual([8, 16]);
    expect(guard.flushIssues()).toHaveLength(2);
  });

  it('resets the streak when a non-identity translation arrives', async () => {
    const guard = createIdentityStreakGuard({ command: 'generate', target: 'fr' });
    await feed(guard, 7);
    await guard.onTranslated('Hello', 'Bonjour', 'key.7');
    await feed(guard, 7);
    expect(guard.flushIssues()).toEqual([]);
  });
});
