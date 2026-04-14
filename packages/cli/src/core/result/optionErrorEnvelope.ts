import { buildCliJsonEnvelope, stringifyEnvelope } from '@/core/result/cliJson.js';
import type { Issue } from '@/types/core/json/envelope.js';

type EmitCliJsonOptionErrorInput = {
  /** Command kind for envelope (for example: `report`, `config`). */
  command: string;
  /** Whether this invocation should emit JSON output. */
  json: boolean;
  /** Stable issue code (command-specific when possible). */
  issueCode: string;
  /** Human-readable validation error message. */
  message: string;
  /** Optional docs path for this option issue. */
  docPath?: string;
  /** Optional payload override; defaults to `{ kind: command }`. */
  data?: unknown;
};

/**
 * Emit a standardized JSON envelope for parse/option validation failures.
 * Returns true when JSON was emitted (caller should stop execution).
 */
export function emitCliJsonOptionError(input: EmitCliJsonOptionErrorInput): boolean {
  if (!input.json) return false;

  const issue: Issue = {
    severity: 'error',
    code: input.issueCode,
    message: input.message,
    ...(input.docPath !== undefined ? { docPath: input.docPath } : {}),
  };

  const data =
    input.data !== undefined
      ? input.data
      : {
          kind: input.command,
        };

  const envelope = buildCliJsonEnvelope(input.command, data, {
    ok: false,
    issues: [issue],
    cwd: process.cwd(),
  });

  console.log(stringifyEnvelope(envelope));
  process.exitCode = 1;
  return true;
}
