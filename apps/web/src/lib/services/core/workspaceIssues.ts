import { buildValidateIssues, enrichIssuesWithDocHrefs } from '@i18nprune/core';
import type { Issue } from '@i18nprune/core/types';
import type { ApiEnvelope } from '../api/client';

function isIssueLike(x: unknown): x is Issue {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    (o.severity === 'error' || o.severity === 'warning' || o.severity === 'info') &&
    typeof o.code === 'string' &&
    typeof o.message === 'string'
  );
}

/** Worker/local validate `data` matches `ValidateScanPayload` from core. */
function isValidateScanPayload(data: unknown): data is {
  missing: unknown[];
  dynamic: { count: number };
  keyObservations: { count: number; observations: unknown[] };
} {
  if (!data || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  if (!Array.isArray(o.missing) || o.dynamic === null || typeof o.dynamic !== 'object') return false;
  if (typeof (o.dynamic as { count?: unknown }).count !== 'number') return false;
  if (o.keyObservations === null || typeof o.keyObservations !== 'object') return false;
  return typeof (o.keyObservations as { count?: unknown }).count === 'number';
}

function isApiEnvelope(payload: unknown): payload is ApiEnvelope<unknown> {
  if (!payload || typeof payload !== 'object') return false;
  const o = payload as Record<string, unknown>;
  return (
    typeof o.success === 'boolean' &&
    'data' in o &&
    Array.isArray(o.errors) &&
    Array.isArray(o.warnings) &&
    typeof o.code === 'string'
  );
}

/**
 * Collect CLI-shaped {@link Issue} rows from a workspace operation result (worker `ApiEnvelope` or local shim).
 * Validate scan payloads are turned into the same issues as CLI via {@link buildValidateIssues}; doc URLs use {@link enrichIssuesWithDocHrefs}.
 */
export function collectWorkspaceIssuesFromResultPayload(payload: unknown): Issue[] {
  const out: Issue[] = [];

  if (!payload || typeof payload !== 'object') {
    return enrichIssuesWithDocHrefs(out);
  }

  const obj = payload as Record<string, unknown>;

  if (isApiEnvelope(payload)) {
    for (const e of payload.errors) {
      out.push({ severity: 'error', code: e.code, message: e.message });
    }
    for (const w of payload.warnings) {
      out.push({ severity: 'warning', code: w.code, message: w.message });
    }
    const data = payload.data;
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d.issues)) {
        for (const item of d.issues) {
          if (isIssueLike(item)) out.push({ ...item });
        }
      } else if (isValidateScanPayload(data)) {
        out.push(
          ...buildValidateIssues({
            missingCount: data.missing.length,
            dynamicSiteCount: data.dynamic.count,
          }),
        );
      }
    }
    return enrichIssuesWithDocHrefs(out);
  }

  if ('message' in obj && typeof obj.message === 'string' && !('success' in obj)) {
    out.push({
      severity: 'error',
      code: 'workspace.runtime_error',
      message: obj.message,
    });
  }

  return enrichIssuesWithDocHrefs(out);
}
