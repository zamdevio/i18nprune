import {
  JSONRPC_INTERNAL_ERROR,
  JSONRPC_INVALID_PARAMS,
  JSONRPC_INVALID_REQUEST,
  JSONRPC_METHOD_NOT_FOUND,
  JSONRPC_NOT_INITIALIZED,
} from './protocol.js';

/**
 * Issue codes surfaced in a JSON-RPC error `data.code`.
 *
 * These are the transport's own codes (invalid request, confinement, version, mode). Core operation
 * issue codes are a separate namespace and arrive inside the result envelope — the two must not be
 * confused, so every transport code carries the `SERVE_` prefix.
 */
export const SERV_ISSUE = {
  parseError: 'SERVE_PARSE_ERROR',
  invalidRequest: 'SERVE_INVALID_REQUEST',
  methodNotFound: 'SERVE_METHOD_NOT_FOUND',
  notInitialized: 'SERVE_NOT_INITIALIZED',
  invalidParams: 'SERVE_INVALID_PARAMS',
  unsupportedProtocolVersion: 'SERVE_UNSUPPORTED_PROTOCOL_VERSION',
  projectRootRequired: 'SERVE_PROJECT_ROOT_REQUIRED',
  projectConfined: 'SERVE_PROJECT_CONFINED',
  writesDisabled: 'SERVE_WRITES_DISABLED',
  shuttingDown: 'SERVE_SHUTTING_DOWN',
  lineTooLong: 'SERVE_LINE_TOO_LONG',
  internalError: 'SERVE_INTERNAL_ERROR',
} as const;

export type ServeIssueCode = (typeof SERV_ISSUE)[keyof typeof SERV_ISSUE] | string;

/**
 * Transport-level failure. Thrown by handlers, caught at the dispatch boundary, and rendered as a
 * JSON-RPC `error`. Never escapes as a thrown exception across `stdout`.
 */
export class ProtocolError extends Error {
  readonly code: number;
  readonly issueCode: ServeIssueCode;

  constructor(code: number, message: string, issueCode: ServeIssueCode) {
    super(message);
    this.name = 'ProtocolError';
    this.code = code;
    this.issueCode = issueCode;
  }
}

export function invalidRequest(message: string, issueCode: ServeIssueCode = SERV_ISSUE.invalidRequest): ProtocolError {
  return new ProtocolError(JSONRPC_INVALID_REQUEST, message, issueCode);
}

export function invalidParams(message: string): ProtocolError {
  return new ProtocolError(JSONRPC_INVALID_PARAMS, message, SERV_ISSUE.invalidParams);
}

export function methodNotFound(method: string): ProtocolError {
  return new ProtocolError(JSONRPC_METHOD_NOT_FOUND, `Method not found: ${method}`, SERV_ISSUE.methodNotFound);
}

export function notInitialized(): ProtocolError {
  return new ProtocolError(
    JSONRPC_NOT_INITIALIZED,
    'Server not initialized — send `initialize` first',
    SERV_ISSUE.notInitialized,
  );
}

export function internalError(message: string): ProtocolError {
  return new ProtocolError(JSONRPC_INTERNAL_ERROR, message, SERV_ISSUE.internalError);
}
