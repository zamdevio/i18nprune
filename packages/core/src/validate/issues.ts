import {
  ISSUE_VALIDATE_DYNAMIC_KEY_SITES,
  ISSUE_VALIDATE_MISSING_LITERAL_KEYS,
} from '../shared/constants/issueCodes.js';
import type { Issue } from '../types/json/envelope/index.js';

/** Build structured `issues[]` for validate envelopes from scan results. */
export function buildValidateIssues(params: {
  missingCount: number;
  dynamicSiteCount: number;
  sourceLocalePath?: string;
}): Issue[] {
  const issues: Issue[] = [];
  if (params.missingCount > 0) {
    issues.push({
      severity: 'warning',
      code: ISSUE_VALIDATE_MISSING_LITERAL_KEYS,
      message: `${String(params.missingCount)} literal key(s) in code are missing from the source locale JSON.`,
      ...(params.sourceLocalePath !== undefined ? { path: params.sourceLocalePath } : {}),
      docPath: 'commands/validate/README',
    });
  }
  if (params.dynamicSiteCount > 0) {
    issues.push({
      severity: 'warning',
      code: ISSUE_VALIDATE_DYNAMIC_KEY_SITES,
      message: `${String(params.dynamicSiteCount)} translation call site(s) use non-literal keys (not proven as static keys).`,
      docPath: 'dynamic/README',
    });
  }
  return issues;
}
