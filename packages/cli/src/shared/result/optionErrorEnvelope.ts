import { buildCliJsonEnvelope, stringifyEnvelope } from '@i18nprune/core';
import type { Issue } from '@i18nprune/core';
import type { EmitCliJsonOptionErrorInput } from '@/types/shared/result/index.js';

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
