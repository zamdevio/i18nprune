import {
  ISSUE_SHARE_REMOTE_ERROR,
  ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE,
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_REJECTED,
  ISSUE_SHARE_REMOTE_UNAVAILABLE,
  ISSUE_SHARE_REMOTE_UPLOAD_REJECTED,
} from '../shared/constants/issueCodes.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { WorkerShareEnvelope } from '../types/share/index.js';

const PAYLOAD_TOO_LARGE_CODES = new Set([
  'UPLOAD_ZIP_TOO_LARGE',
  'UPLOAD_TOO_MANY_FILES',
  'UPLOAD_TEXT_LIMIT_EXCEEDED',
  'REPORT_PAYLOAD_TOO_LARGE',
]);

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
  return { success, code, data, errors };
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

/** Reads `data.projectId` from a successful worker upload envelope. */
export function workerDataProjectId(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const id = (data as Record<string, unknown>).projectId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

/** Reads `data.reportId` from a successful worker report upload envelope. */
export function workerDataReportId(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const id = (data as Record<string, unknown>).reportId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}
