import {
  ISSUE_SHARE_REMOTE_ERROR,
  ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE,
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_REJECTED,
  ISSUE_SHARE_REMOTE_UNAVAILABLE,
  ISSUE_SHARE_REMOTE_UPLOAD_REJECTED,
} from '../../shared/constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { WorkerShareEnvelope } from '../../types/share/index.js';

const PAYLOAD_TOO_LARGE_CODES = new Set([
  'PAYLOAD_TOO_LARGE',
  'TOO_MANY_FILES',
  'EXTRACTION_LIMIT_EXCEEDED',
  'REPORT_PAYLOAD_TOO_LARGE',
]);

const RETRYABLE_WORKER_CODES = new Set(['RATE_LIMITED', 'WORKER_BUSY', 'UPLOAD_TIMEOUT']);

const STORAGE_QUOTA_CODES = new Set(['STORAGE_QUOTA_EXCEEDED']);

const REPORT_REJECT_CODES = new Set(['REPORT_PAYLOAD_INVALID', 'REPORT_SCHEMA_INVALID']);

const UPLOAD_REJECT_PREFIX = 'UPLOAD_';

/**
 * Parses worker JSON body into a minimal envelope shape. Unknown bodies yield `success: false`.
 */
export function parseWorkerShareEnvelope(body: unknown): WorkerShareEnvelope {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { success: false, data: null, errors: [{ code: 'WORKER_BODY_INVALID', message: 'Response body was not a JSON object.' }] };
  }
  const o = body as Record<string, unknown>;
  const success = o.success === true;
  const code = typeof o.code === 'string' ? o.code : undefined;
  const data = 'data' in o ? o.data : undefined;
  const errorsRaw = o.errors;
  const errors: Array<{ code: string; message: string }> = [];
  if (Array.isArray(errorsRaw)) {
    for (const e of errorsRaw) {
      if (e && typeof e === 'object' && !Array.isArray(e)) {
        const er = e as Record<string, unknown>;
        const c = typeof er.code === 'string' ? er.code : 'UNKNOWN';
        const m = typeof er.message === 'string' ? er.message : '';
        errors.push({ code: c, message: m });
      }
    }
  }
  const warningsRaw = o.warnings;
  const warnings: Array<{ code: string; message: string }> = [];
  if (Array.isArray(warningsRaw)) {
    for (const w of warningsRaw) {
      if (w && typeof w === 'object' && !Array.isArray(w)) {
        const wr = w as Record<string, unknown>;
        const c = typeof wr.code === 'string' ? wr.code : 'UNKNOWN';
        const m = typeof wr.message === 'string' ? wr.message : '';
        warnings.push({ code: c, message: m });
      }
    }
  }
  return { success, code, data, errors, ...(warnings.length > 0 ? { warnings } : {}) };
}

/** Reads `expiresAt` from a successful worker upload `data` payload. */
export function workerUploadExpiresAt(data: unknown, kind: 'project' | 'report'): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const d = data as Record<string, unknown>;
  if (kind === 'project') {
    const meta = d.snapshotMeta;
    if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
      const exp = (meta as Record<string, unknown>).expiresAt;
      return typeof exp === 'string' && exp.length > 0 ? exp : undefined;
    }
    return undefined;
  }
  const exp = d.expiresAt;
  return typeof exp === 'string' && exp.length > 0 ? exp : undefined;
}

export function workerUploadWasDeduped(envelope: WorkerShareEnvelope): boolean {
  if (envelope.code === 'HASH_ALREADY_EXISTS') return true;
  return (envelope.warnings ?? []).some((w) => w.code === 'HASH_ALREADY_EXISTS');
}

function firstWorkerMessage(env: WorkerShareEnvelope): string {
  const e0 = env.errors[0];
  if (e0?.message) return e0.message;
  if (typeof env.code === 'string' && env.code.length > 0) return env.code;
  return 'Worker request failed.';
}

function firstWorkerCode(env: WorkerShareEnvelope): string | undefined {
  return env.errors[0]?.code ?? env.code;
}

/**
 * Maps HTTP status + worker error codes to a stable {@link Issue} for share flows.
 */
/** True when the worker confirmed the project/report id does not exist (safe to drop stale `share.json` rows). */
export function isShareRemoteNotFoundIssue(issue: Issue): boolean {
  return (
    issue.code === ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND || issue.code === ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND
  );
}

export function shareRemoteIssueFromWorker(input: {
  httpStatus: number;
  envelope: WorkerShareEnvelope;
}): Issue | null {
  const { httpStatus, envelope } = input;
  if (httpStatus >= 200 && httpStatus < 300 && envelope.success) {
    return null;
  }

  const workerCode = firstWorkerCode(envelope);
  const message = firstWorkerMessage(envelope);

  if (httpStatus === 404) {
    if (workerCode === 'PROJECT_NOT_FOUND') {
      return {
        severity: 'error',
        code: ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
        message:
          'Project not found on the worker (wrong id or removed after ~7 days idle). Re-upload from the CLI or web workspace, then share again.',
      };
    }
    if (workerCode === 'REPORT_NOT_FOUND') {
      return {
        severity: 'error',
        code: ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
        message:
          'Report not found on the worker (wrong id or removed after ~7 days idle). Re-share the report from the CLI or report app.',
      };
    }
    return {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_ERROR,
      message: `${message} (HTTP ${String(httpStatus)})`,
    };
  }

  if (httpStatus === 507 || (workerCode && STORAGE_QUOTA_CODES.has(workerCode))) {
    return {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_UNAVAILABLE,
      message: `Worker storage limit reached (${workerCode ?? 'STORAGE_QUOTA_EXCEEDED'}): ${message}`,
    };
  }

  if (httpStatus === 429 || (workerCode && RETRYABLE_WORKER_CODES.has(workerCode))) {
    return {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_UNAVAILABLE,
      message: `Worker temporarily unavailable (${workerCode ?? 'RATE_LIMITED'}): ${message}`,
    };
  }

  if (httpStatus === 413 || (httpStatus === 400 && workerCode && PAYLOAD_TOO_LARGE_CODES.has(workerCode))) {
    return {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE,
      message: `Payload too large for the worker: ${message}`,
    };
  }

  if (httpStatus === 400 && workerCode && REPORT_REJECT_CODES.has(workerCode)) {
    return {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_REPORT_REJECTED,
      message: `Report rejected by the worker: ${message}`,
    };
  }

  if (httpStatus === 400 && workerCode && workerCode.startsWith(UPLOAD_REJECT_PREFIX)) {
    return {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_UPLOAD_REJECTED,
      message: `Upload rejected by the worker: ${message}`,
    };
  }

  if (httpStatus === 400) {
    return {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_UPLOAD_REJECTED,
      message: `Bad request: ${message}`,
    };
  }

  if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504 || httpStatus === 0) {
    return {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_UNAVAILABLE,
      message: `Worker unavailable (HTTP ${String(httpStatus)}): ${message}`,
    };
  }

  if (httpStatus >= 500) {
    return {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_UNAVAILABLE,
      message: `Worker error (HTTP ${String(httpStatus)}): ${message}`,
    };
  }

  return {
    severity: 'error',
    code: ISSUE_SHARE_REMOTE_ERROR,
    message: `${message} (HTTP ${String(httpStatus)})`,
  };
}

export type ShareRemoteDeleteOutcome = {
  /** Worker row removed or was already absent (idempotent DELETE). */
  deletedRemote: boolean;
  /** HTTP 404 / worker not-found codes — DELETE treated as success. */
  alreadyAbsent: boolean;
  issue: Issue | null;
};

/**
 * Maps worker `DELETE` responses for share delete (idempotent: 404 / not-found → success + warning).
 */
export function resolveShareRemoteDeleteOutcome(input: {
  httpStatus: number;
  envelope: WorkerShareEnvelope;
  kind: 'project' | 'report';
}): ShareRemoteDeleteOutcome {
  const { httpStatus, envelope, kind } = input;

  if (httpStatus === 404) {
    const code = kind === 'project' ? ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND : ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND;
    const label = kind === 'project' ? 'project' : 'report';
    return {
      deletedRemote: true,
      alreadyAbsent: true,
      issue: {
        severity: 'warning',
        code,
        message: `Worker ${label} "${firstWorkerMessage(envelope)}" was already removed or never existed; DELETE is complete.`,
      },
    };
  }

  if (httpStatus >= 200 && httpStatus < 300) {
    if (envelope.success) {
      const removed = workerDataDeleteRemoved(envelope.data);
      if (removed === false) {
        const code =
          kind === 'project' ? ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND : ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND;
        const label = kind === 'project' ? 'project' : 'report';
        return {
          deletedRemote: true,
          alreadyAbsent: true,
          issue: {
            severity: 'warning',
            code,
            message: `Worker ${label} was not found on the server (already deleted or unknown id). Nothing left to delete remotely.`,
          },
        };
      }
      return { deletedRemote: true, alreadyAbsent: false, issue: null };
    }
    return {
      deletedRemote: false,
      alreadyAbsent: false,
      issue: shareRemoteIssueFromWorker({ httpStatus, envelope }),
    };
  }

  return {
    deletedRemote: false,
    alreadyAbsent: false,
    issue: shareRemoteIssueFromWorker({ httpStatus, envelope }),
  };
}

/** Reads `data.projectId` from a successful worker upload envelope. */
export function workerDataProjectId(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const id = (data as Record<string, unknown>).projectId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

/** Reads `data.deleted` from a successful worker DELETE envelope (`true` = row existed and was removed). */
export function workerDataDeleteRemoved(data: unknown): boolean | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const deleted = (data as Record<string, unknown>).deleted;
  return typeof deleted === 'boolean' ? deleted : undefined;
}

/** Reads `data.reportId` from a successful worker report upload envelope. */
export function workerDataReportId(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const id = (data as Record<string, unknown>).reportId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}
