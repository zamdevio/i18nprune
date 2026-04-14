import { resolveContext } from '@/core/context/index.js';
import { I18nPruneError } from '@/core/errors/internal.js';
import {
  ISSUE_CONTEXT_DISCOVERY_WARNING,
  ISSUE_CONTEXT_RESOLUTION_FAILED,
} from '@/constants/issueCodes.js';
import { RESULT_API_VERSION } from '@/constants/result.js';
import { enrichIssuesWithDocHrefs } from '@/core/result/issueDocLinks.js';
import type { Context } from '@/types/core/context/index.js';
import type { Issue, Result } from '@/types/core/json/envelope.js';

function resolutionFailedIssue(err: unknown): Issue {
  if (err instanceof I18nPruneError) {
    return {
      severity: 'error',
      code: ISSUE_CONTEXT_RESOLUTION_FAILED,
      message: err.message,
      docPath: 'json/issue-codes',
    };
  }
  if (err instanceof Error) {
    return {
      severity: 'error',
      code: ISSUE_CONTEXT_RESOLUTION_FAILED,
      message: err.message,
      docPath: 'json/issue-codes',
    };
  }
  return {
    severity: 'error',
    code: ISSUE_CONTEXT_RESOLUTION_FAILED,
    message: String(err),
    docPath: 'json/issue-codes',
  };
}

/**
 * Resolve project context without throwing: returns {@link Result} with `data` on success
 * or `kind: 'failed'` and structured `issues[]` on failure.
 * Discovery warnings from `ctx.meta.warnings` are mirrored as `issues` (severity `warning`).
 */
export function tryResolveContext(cwd = process.cwd()): Result<'context', Context> {
  const meta = { apiVersion: RESULT_API_VERSION, cwd };
  try {
    const ctx = resolveContext(cwd);
    const issues: Issue[] = enrichIssuesWithDocHrefs(
      ctx.meta.warnings.map((message) => ({
        severity: 'warning' as const,
        code: ISSUE_CONTEXT_DISCOVERY_WARNING,
        message,
      })),
    );
    return { ok: true, kind: 'context', data: ctx, issues, meta };
  } catch (e) {
    return {
      ok: false,
      kind: 'failed',
      issues: enrichIssuesWithDocHrefs([resolutionFailedIssue(e)]),
      meta,
    };
  }
}
