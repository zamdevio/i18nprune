import { ENV_CI, ENV_I18NPRUNE_NO_INIT } from '@/constants/env.js';

/**
 * Whether interactive prompts should be skipped (CI, piped stdin, `I18NPRUNE_NO_INIT=1`).
 * Used by init, duplicate-config resolution (`ensure`), and generate TTY checks.
 */
export function shouldSkipInteractivePrompts(): boolean {
  const ci = process.env[ENV_CI];
  if (ci === '1' || ci === 'true') return true;
  const noInit = process.env[ENV_I18NPRUNE_NO_INIT];
  if (noInit === '1' || noInit === 'true') return true;
  if (!process.stdin.isTTY) return true;
  return false;
}
