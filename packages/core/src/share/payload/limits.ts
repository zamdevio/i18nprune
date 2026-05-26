import { ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE } from '../../shared/constants/issueCodes.js';
import {
  PROJECT_SHARE_PREPARED_MAX_BYTES,
  REPORT_SHARE_MAX_BYTES,
} from '../../shared/constants/share.js';
import type { Issue } from '../../types/json/envelope/index.js';

export function assertReportShareWithinLimit(byteSize: number): Issue | undefined {
  if (byteSize <= REPORT_SHARE_MAX_BYTES) return undefined;
  return {
    severity: 'error',
    code: ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE,
    message: `Prepared report JSON exceeds the worker report limit (${String(REPORT_SHARE_MAX_BYTES)} bytes; received ${String(byteSize)}).`,
  };
}

export function assertHostedProjectPreparedWithinLimit(byteSize: number): Issue | undefined {
  if (byteSize <= PROJECT_SHARE_PREPARED_MAX_BYTES) return undefined;
  return {
    severity: 'error',
    code: ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE,
    message: `Prepared project snapshot JSON exceeds the worker project limit (${String(PROJECT_SHARE_PREPARED_MAX_BYTES)} bytes; received ${String(byteSize)}).`,
  };
}
