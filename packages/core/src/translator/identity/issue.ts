import {
  ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT,
  ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING,
} from '../../shared/constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../../shared/docs/issueAnchors.js';
import type { Issue } from '../../types/json/envelope/index.js';

export function buildIdentityStreakIssue(params: {
  severity: 'warning' | 'error';
  target: string;
  count: number;
  path: string;
}): Issue {
  const code =
    params.severity === 'error'
      ? ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT
      : ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING;
  return {
    severity: params.severity,
    code,
    message: `Target "${params.target}" produced ${String(params.count)} consecutive source-identical translations (latest path: ${params.path}).`,
    docPath: issueCodeRepoDocPathForIssueCode(code),
  };
}
