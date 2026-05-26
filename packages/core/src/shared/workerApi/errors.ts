import {
  ISSUE_PROJECT_HOSTED_SNAPSHOT_INVALID,
  ISSUE_PROJECT_HOSTED_SNAPSHOT_SCHEMA_VERSION,
  ISSUE_REPORT_HOSTED_REPORT_INVALID,
} from '../constants/issueCodes.js';
import { GITHUB_REPO_URL } from '../constants/links.js';
import { PROJECT_SHARE_PREPARED_MAX_BYTES, REPORT_SHARE_MAX_BYTES } from '../constants/share.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type {
  WorkerApiErrorItem,
  WorkerApiWarningItem,
  WorkerErrorAction,
  WorkerErrorHttpStatus,
} from '../../types/project/workerApi.js';

const PAYLOAD_TOO_LARGE_CODES = new Set(['PAYLOAD_TOO_LARGE', 'REPORT_PAYLOAD_TOO_LARGE']);

const TOO_MANY_FILES_CODES = new Set(['TOO_MANY_FILES']);

const EXTRACTION_LIMIT_CODES = new Set(['EXTRACTION_LIMIT_EXCEEDED']);

function isInvalidPayloadIssue(code: string): boolean {
  return (
    code === ISSUE_PROJECT_HOSTED_SNAPSHOT_INVALID ||
    code === ISSUE_PROJECT_HOSTED_SNAPSHOT_SCHEMA_VERSION ||
    code === ISSUE_REPORT_HOSTED_REPORT_INVALID
  );
}

/** Build a worker API error item with optional UX fields for CLI/SPA. */
export function buildWorkerApiError(input: {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
  suggestions?: string[];
  recoverable?: boolean;
  action?: WorkerErrorAction;
  retryAfterSeconds?: number;
}): WorkerApiErrorItem {
  return {
    code: input.code,
    message: input.message,
    ...(input.details !== undefined ? { details: input.details } : {}),
    ...(input.suggestions !== undefined ? { suggestions: input.suggestions } : {}),
    ...(input.recoverable !== undefined ? { recoverable: input.recoverable } : {}),
    ...(input.action !== undefined ? { action: input.action } : {}),
    ...(input.retryAfterSeconds !== undefined ? { retryAfterSeconds: input.retryAfterSeconds } : {}),
  };
}

/** Suggested HTTP status for a canonical worker error code. */
export function workerErrorHttpStatus(code: string): WorkerErrorHttpStatus {
  switch (code) {
    case 'PAYLOAD_TOO_LARGE':
    case 'TOO_MANY_FILES':
    case 'EXTRACTION_LIMIT_EXCEEDED':
      return 413;
    case 'RATE_LIMITED':
      return 429;
    case 'STORAGE_QUOTA_EXCEEDED':
      return 507;
    case 'WORKER_BUSY':
    case 'UPLOAD_TIMEOUT':
      return 503;
    case 'PROJECT_NOT_FOUND':
    case 'REPORT_NOT_FOUND':
      return 404;
    default:
      return 400;
  }
}

function reducePayloadError(
  code: 'PAYLOAD_TOO_LARGE' | 'TOO_MANY_FILES' | 'EXTRACTION_LIMIT_EXCEEDED',
  message: string,
  details?: Record<string, string | number | boolean | null>,
): WorkerApiErrorItem {
  const suggestions =
    code === 'TOO_MANY_FILES'
      ? ['Reduce the number of files in the archive or exclude vendor/build paths in i18nprune.config.']
      : code === 'EXTRACTION_LIMIT_EXCEEDED'
        ? ['Shrink locale/source scope or split the project before sharing.']
        : [
            `Prepared project JSON must stay under ${String(PROJECT_SHARE_PREPARED_MAX_BYTES)} bytes; report JSON under ${String(REPORT_SHARE_MAX_BYTES)} bytes.`,
            'Run share upload after a smaller prepare, or use archive upload with a trimmed zip.',
          ];
  return buildWorkerApiError({
    code,
    message,
    details,
    suggestions,
    recoverable: true,
    action: 'reduce_payload',
  });
}

/** Maps a worker route error code into a structured API error item. */
export function workerErrorFromCode(
  code: string,
  message: string,
  details?: Record<string, string | number | boolean | null>,
): WorkerApiErrorItem {
  if (PAYLOAD_TOO_LARGE_CODES.has(code)) {
    return reducePayloadError('PAYLOAD_TOO_LARGE', message, details);
  }
  if (TOO_MANY_FILES_CODES.has(code)) {
    return reducePayloadError('TOO_MANY_FILES', message, details);
  }
  if (EXTRACTION_LIMIT_CODES.has(code)) {
    return reducePayloadError('EXTRACTION_LIMIT_EXCEEDED', message, details);
  }
  if (code === 'INGEST_JSON_INVALID' || code === 'INGEST_JSON_REQUIRED') {
    return buildWorkerApiError({
      code: 'INVALID_SCHEMA',
      message,
      details,
      suggestions: ['Send application/json with a prepared snapshot or report document.'],
      recoverable: true,
      action: 'fix_payload',
    });
  }
  return buildWorkerApiError({ code, message, details, recoverable: false });
}

function issueCodeTail(issue: Issue): string {
  return issue.code.replace(/^i18nprune\.(project|report|share)\./, '').replace(/\./g, '_').toUpperCase();
}

/** Maps a core {@link Issue} from validateHosted* into a structured worker error. */
export function workerErrorFromIssue(issue: Issue): WorkerApiErrorItem {
  if (
    PAYLOAD_TOO_LARGE_CODES.has(issue.code) ||
    TOO_MANY_FILES_CODES.has(issue.code) ||
    EXTRACTION_LIMIT_CODES.has(issue.code) ||
    issue.code.startsWith('UPLOAD_')
  ) {
    return workerErrorFromCode(issue.code, issue.message);
  }
  if (isInvalidPayloadIssue(issue.code)) {
    return buildWorkerApiError({
      code: issue.code === ISSUE_PROJECT_HOSTED_SNAPSHOT_SCHEMA_VERSION ? 'INVALID_SCHEMA' : 'PAYLOAD_REJECTED',
      message: issue.message,
      suggestions: ['Fix the prepared snapshot or report JSON, then upload again.'],
      recoverable: true,
      action: 'fix_payload',
    });
  }
  const tail = issueCodeTail(issue);
  return buildWorkerApiError({
    code: tail.length > 0 ? tail : 'INGEST_INVALID',
    message: issue.message,
    recoverable: false,
  });
}

export function workerPayloadTooLargeError(input: {
  kind: 'project_prepared' | 'project_zip' | 'report';
  receivedBytes: number;
  maxBytes: number;
}): WorkerApiErrorItem {
  const label =
    input.kind === 'report'
      ? 'Report JSON'
      : input.kind === 'project_zip'
        ? 'Zip archive'
        : 'Prepared project JSON';
  return reducePayloadError('PAYLOAD_TOO_LARGE', `${label} exceeds max size (${String(input.maxBytes)} bytes).`, {
    maxBytes: input.maxBytes,
    receivedBytes: input.receivedBytes,
  });
}

export function workerRateLimitedError(retryAfterSeconds = 60): WorkerApiErrorItem {
  return buildWorkerApiError({
    code: 'RATE_LIMITED',
    message: 'Too many upload requests from this client. Try again shortly.',
    recoverable: true,
    action: 'retry',
    retryAfterSeconds,
    suggestions: ['Wait and retry, or run share upload from CI with backoff.'],
  });
}

export function workerBusyError(): WorkerApiErrorItem {
  return buildWorkerApiError({
    code: 'WORKER_BUSY',
    message: 'Worker is handling too many uploads at once. Try again in a few seconds.',
    recoverable: true,
    action: 'retry',
    retryAfterSeconds: 5,
    suggestions: ['Retry the upload; avoid parallel share uploads to the same worker.'],
  });
}

const SELF_HOST_DOC = `${GITHUB_REPO_URL}/tree/main/apps/workers/i18nprune`;

export function workerStorageLimitError(message = 'Worker storage limit reached for this isolate.'): WorkerApiErrorItem {
  return buildWorkerApiError({
    code: 'STORAGE_QUOTA_EXCEEDED',
    message,
    recoverable: true,
    action: 'self_host',
    suggestions: [
      `Host your own worker copy: ${SELF_HOST_DOC}`,
      'Reduce payload size or upload frequency, then retry.',
    ],
  });
}

export function workerProjectNotFoundError(): WorkerApiErrorItem {
  return buildWorkerApiError({
    code: 'PROJECT_NOT_FOUND',
    message:
      'Project not found. It may never have existed, was deleted, or was removed after ~7 days without reads. Upload a new snapshot.',
    recoverable: true,
    action: 'reupload',
    suggestions: ['Run i18nprune share upload --project to host a fresh snapshot.'],
  });
}

export function workerHashAlreadyExistsWarning(
  kind: 'project' | 'report',
  existingId: string,
): WorkerApiWarningItem {
  const label = kind === 'project' ? 'project' : 'report';
  return {
    code: 'HASH_ALREADY_EXISTS',
    message: `Same content hash already hosted — reusing existing ${label} ${existingId} (no duplicate row stored).`,
    details: { kind, existingId },
  };
}

export function workerReportNotFoundError(): WorkerApiErrorItem {
  return buildWorkerApiError({
    code: 'REPORT_NOT_FOUND',
    message:
      'Report not found. It may never have existed, was deleted, or was removed after ~7 days without reads. Share the report again.',
    recoverable: true,
    action: 'reupload',
    suggestions: ['Run i18nprune share upload --report to host a fresh report JSON.'],
  });
}
