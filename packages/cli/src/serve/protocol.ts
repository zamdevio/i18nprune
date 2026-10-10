/**
 * JSON-RPC 2.0 wire types and builders for `i18nprune serve`.
 *
 * Framing is NDJSON — one JSON object per line — so this module never emits a raw newline inside a
 * message (`JSON.stringify` escapes embedded newlines). See
 * [ADR 012](../../../../docs/architecture/decisions/012-cli-serve-transport.md) §Protocol.
 */

/** JSON-RPC id as it appears on the wire: string or number, never null (null is reserved for errors). */
export type JsonRpcId = string | number;

/** Standard JSON-RPC 2.0 error codes used by the transport. */
export const JSONRPC_PARSE_ERROR = -32700;
export const JSONRPC_INVALID_REQUEST = -32600;
export const JSONRPC_METHOD_NOT_FOUND = -32601;
export const JSONRPC_INVALID_PARAMS = -32602;
export const JSONRPC_INTERNAL_ERROR = -32603;
/** Implementation-defined: request received before a successful `initialize`. */
export const JSONRPC_NOT_INITIALIZED = -32002;

/**
 * One inbound message, requests and notifications normalized to a single shape.
 * `id === null` means the line carried no `id` (a notification → no reply).
 */
export type JsonRpcInboundMessage = {
  readonly id: JsonRpcId | null;
  readonly method: string;
  readonly params: unknown;
};

export type JsonRpcSuccess = { readonly jsonrpc: '2.0'; readonly id: JsonRpcId; readonly result: unknown };
export type JsonRpcFailure = {
  readonly jsonrpc: '2.0';
  readonly id: JsonRpcId | null;
  readonly error: { readonly code: number; readonly message: string; readonly data?: unknown };
};
export type JsonRpcNotificationOut = {
  readonly jsonrpc: '2.0';
  readonly method: string;
  readonly params?: unknown;
};
export type JsonRpcOutbound = JsonRpcSuccess | JsonRpcFailure | JsonRpcNotificationOut;

/** Outcome of framing one line. */
export type ParseLineResult =
  | { readonly frame: 'message'; readonly message: JsonRpcInboundMessage }
  | { readonly frame: 'parse_error' }
  | { readonly frame: 'invalid_request'; readonly id: JsonRpcId | null };

function isJsonRpcId(value: unknown): value is JsonRpcId {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * Parse one NDJSON line into a message. A syntactically valid JSON value that is not a well-formed
 * JSON-RPC request is `invalid_request` (id echoed when usable, else null); unparseable JSON is
 * `parse_error`. Never throws.
 */
export function parseLine(line: string): ParseLineResult {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return { frame: 'parse_error' };
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { frame: 'invalid_request', id: null };
  }
  const obj = value as Record<string, unknown>;
  const id = isJsonRpcId(obj.id) ? obj.id : null;
  if (obj.jsonrpc !== '2.0' || typeof obj.method !== 'string') {
    return { frame: 'invalid_request', id };
  }
  return { frame: 'message', message: { id, method: obj.method, params: obj.params } };
}

export function buildResult(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: '2.0', id, result };
}

export function buildError(
  id: JsonRpcId | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcFailure {
  return {
    jsonrpc: '2.0',
    id,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}

export function buildNotification(method: string, params?: unknown): JsonRpcNotificationOut {
  return params === undefined ? { jsonrpc: '2.0', method } : { jsonrpc: '2.0', method, params };
}

/** Serialize one outbound message as a single `\n`-terminated line. */
export function serializeMessage(message: JsonRpcOutbound): string {
  return `${JSON.stringify(message)}\n`;
}
