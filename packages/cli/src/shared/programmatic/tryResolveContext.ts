import { resolveContext } from '@/shared/context/index.js';
import { I18nPruneError, issueCodeRepoDocPathForIssueCode } from '@i18nprune/core';
import {
  ISSUE_CONTEXT_DISCOVERY_WARNING,
  ISSUE_CONTEXT_RESOLUTION_FAILED,
} from '@/constants/issueCodes.js';
import { RESULT_API_VERSION } from '@/constants/result.js';
import { enrichIssuesWithDocHrefs } from '@/shared/result/issueDocLinks.js';
import type { Context } from '@/types/core/context/index.js';
import type { Issue, Result } from '@/types/core/json/envelope.js';

function resolutionFailedIssue(err: unknown): Issue {
  if (err instanceof I18nPruneError) {
    return {
      severity: 'error',
      code: ISSUE_CONTEXT_RESOLUTION_FAILED,
      message: err.message,
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_CONTEXT_RESOLUTION_FAILED),
    };
  }
  if (err instanceof Error) {
    return {
      severity: 'error',
      code: ISSUE_CONTEXT_RESOLUTION_FAILED,
      message: err.message,
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_CONTEXT_RESOLUTION_FAILED),
    };
  }
  return {
    severity: 'error',
    code: ISSUE_CONTEXT_RESOLUTION_FAILED,
    message: String(err),
    docPath: issueCodeRepoDocPathForIssueCode(ISSUE_CONTEXT_RESOLUTION_FAILED),
  };
}

/**
 * Resolve project context without throwing: returns {@link Result} with `data` on success
 * or `kind: 'failed'` and structured `issues[]` on failure.
 * Discovery warnings from `ctx.meta.warnings` are mirrored as `issues` (severity `warning`).
 */
export async function tryResolveContext(cwd = process.cwd()): Promise<Result<'context', Context>> {
  const meta = { apiVersion: RESULT_API_VERSION, cwd };
  try {
    const ctx = await resolveContext(cwd);
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
