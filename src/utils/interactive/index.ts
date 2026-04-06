/**
 * Whether interactive prompts should be skipped (CI, piped stdin, `I18NPRUNE_NO_INIT=1`).
 * Used by init, duplicate-config resolution (`ensure`), and generate TTY checks.
 */
export function shouldSkipInteractivePrompts(): boolean {
  if (process.env.CI === '1' || process.env.CI === 'true') return true;
  if (process.env.I18NPRUNE_NO_INIT === '1' || process.env.I18NPRUNE_NO_INIT === 'true') return true;
  if (!process.stdin.isTTY) return true;
  return false;
}
