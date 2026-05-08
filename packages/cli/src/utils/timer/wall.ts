/**
 * Wall clock for a CLI run, excluding intervals blocked on user input ({@linkplain duringPrompt}).
 */
export type WallTimer = {
  /** Exclude elapsed time until {@link resume} (nested pauses stack). */
  pause(): void;
  /** Undo one {@link pause}; excluded interval is summed when nesting returns to zero. */
  resume(): void;
  /** Milliseconds since creation, minus completed pause intervals (and active pause since last pause). */
  elapsedMs(): number;
};

function assertNonNegative(ms: number): number {
  return ms < 0 ? 0 : ms;
}

export function createWallTimer(): WallTimer {
  const start = Date.now();
  let pauseDepth = 0;
  let pauseStartedAt: number | null = null;
  let excludedMs = 0;

  return {
    pause(): void {
      pauseDepth += 1;
      if (pauseDepth === 1) pauseStartedAt = Date.now();
    },
    resume(): void {
      if (pauseDepth <= 0) return;
      if (pauseDepth === 1 && pauseStartedAt !== null) {
        excludedMs += Date.now() - pauseStartedAt;
        pauseStartedAt = null;
      }
      pauseDepth -= 1;
    },
    elapsedMs(): number {
      const now = Date.now();
      let activePauseMs = 0;
      if (pauseDepth > 0 && pauseStartedAt !== null) activePauseMs = now - pauseStartedAt;
      return assertNonNegative(now - start - excludedMs - activePauseMs);
    },
  };
}
