import type { RunOptions } from '@/types/core/runtime/index.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';

/**
 * True when interactive `@inquirer/prompts` may run: TTY stdin/stdout, not JSON mode,
 * not CI/pipe (see `shouldSkipInteractivePrompts`).
 */
export function canAsk(run?: RunOptions): boolean {
  if (run?.json) return false;
  if (shouldSkipInteractivePrompts()) return false;
  return process.stdin.isTTY && process.stdout.isTTY;
}
