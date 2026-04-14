import {
  ISSUE_VALIDATE_DYNAMIC_KEY_SITES,
  ISSUE_VALIDATE_MISSING_LITERAL_KEYS,
} from '@/constants/issueCodes.js';
import type { Issue } from '@/types/core/json/envelope.js';

/** Build structured `issues[]` for `validate` JSON output (aligned with human warnings). */
export function buildValidateJsonIssues(params: {
  missing: string[];
  dynamicSiteCount: number;
  sourceLocalePath?: string;
}): Issue[] {
  const issues: Issue[] = [];
  if (params.missing.length > 0) {
    issues.push({
      severity: 'warning',
      code: ISSUE_VALIDATE_MISSING_LITERAL_KEYS,
      message: `${String(params.missing.length)} literal key(s) in code are missing from the source locale JSON.`,
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
