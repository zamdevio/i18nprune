import { createWallTimer, type WallTimer } from './wall.js';

/** Process-wide interactive wall timer — only non-null while a CLI command installs one. */
let active: WallTimer | null = null;

/** Install **`active`**; call **`dispose()`** in **`finally`** (one command at a time). */
export function attachWallTimer(): WallTimer & { dispose(): void } {
  const timer = createWallTimer();
  active = timer;
  return {
    pause: timer.pause.bind(timer),
    resume: timer.resume.bind(timer),
    elapsedMs: timer.elapsedMs.bind(timer),
    dispose() {
      if (active === timer) active = null;
    },
  };
}

/**
 * Exclude wall time during **`@inquirer/prompts`** (or other blocking stdin reads) from
 * {@link WallTimer.elapsedMs}.
 */
export async function duringPrompt<T>(fn: () => Promise<T>): Promise<T> {
  const t = active;
  t?.pause();
  try {
    return await fn();
  } finally {
    t?.resume();
  }
}
