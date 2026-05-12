import { issueCodeRepoDocPathForIssueCode } from '@i18nprune/core';
import { normalizeUnknownError } from '@/shared/errors/normalize.js';
import { ISSUE_IO_READ_FAILED } from '@/constants/issueCodes.js';
import { buildCliJsonEnvelope } from '@i18nprune/core';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@i18nprune/core';
import type { Issue } from '@i18nprune/core';

function errnoPath(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'path' in err) {
    const p = (err as NodeJS.ErrnoException).path;
    if (typeof p === 'string') return p;
  }
  return undefined;
}

/**
 * When a `--json` command cannot complete because of I/O (read JSON, list dir, …), return one envelope with
 * **`ok: false`** and **`i18nprune.io.read_failed`** instead of throwing (so stdout stays JSON-only for scripts).
 */
export function buildIoReadFailureEnvelope<K extends string, D>(
  kind: K,
  emptyData: D,
  ctx: Context | null,
  err: unknown,
): CliJsonEnvelope<K, D> {
  const n = normalizeUnknownError(err);
  const ioIssue: Issue = {
    severity: 'error',
    code: ISSUE_IO_READ_FAILED,
    message: n.message,
    path: errnoPath(err),
    docPath: issueCodeRepoDocPathForIssueCode(ISSUE_IO_READ_FAILED),
  };
  const base = ctx ? mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), [ioIssue]) : [ioIssue];
  return buildCliJsonEnvelope(kind, emptyData, {
    ok: false,
    issues: base,
    cwd: process.cwd(),
  });
}
