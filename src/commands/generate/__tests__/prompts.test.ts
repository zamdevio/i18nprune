import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { canPromptGenerate } from '@/commands/generate/prompts.js';

describe('canPromptGenerate', () => {
  const ttyIn = { isTTY: true } as unknown as typeof process.stdin;
  const ttyOut = { isTTY: true } as unknown as typeof process.stdout;

  beforeEach(() => {
    vi.stubEnv('CI', undefined);
    vi.stubEnv('I18NPRUNE_NO_INIT', undefined);
    vi.spyOn(process, 'stdin', 'get').mockReturnValue(ttyIn);
    vi.spyOn(process, 'stdout', 'get').mockReturnValue(ttyOut);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns false when run.json is true even if stdin/stdout are TTY', () => {
    expect(
      canPromptGenerate({ json: true, quiet: false, silent: false }),
    ).toBe(false);
  });

  it('returns true when TTY and run is not json', () => {
    expect(canPromptGenerate({ json: false, quiet: false, silent: false })).toBe(true);
  });

  it('returns false when CI=1', () => {
    vi.stubEnv('CI', '1');
    expect(canPromptGenerate({ json: false, quiet: false, silent: false })).toBe(false);
  });
});
