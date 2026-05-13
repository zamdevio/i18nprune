/**
 * **CLI host only** — core and SDK callers never touch `process.*`.
 *
 * CI/automation contract: when a command’s logical outcome is failure (`envelope.ok === false`,
 * or an equivalent combined gate such as doctor + patching), the process should exit non-zero.
 * Call this from each command’s `run.ts` under `packages/cli/src/commands/` after the same
 * truth you surface in `--json` envelopes or `printCommandSummary`.
 *
 * Only sets `process.exitCode = 1` on failure; does not force `0` on success (single-shot CLI
 * invocations start with an implicit success exit).
 */
export function applyCliCiExitGate(ok: boolean): void {
  if (!ok) process.exitCode = 1;
}
