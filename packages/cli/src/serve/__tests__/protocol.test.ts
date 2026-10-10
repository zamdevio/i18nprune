import { describe, expect, it } from 'vitest';
import {
  JSONRPC_INVALID_REQUEST,
  buildError,
  buildNotification,
  buildResult,
  parseLine,
  serializeMessage,
} from '@/serve/protocol.js';

describe('serve protocol — NDJSON framing', () => {
  it('serializes a result as one newline-terminated line with no embedded newline', () => {
    const line = serializeMessage(buildResult(7, { nested: { text: 'a\nb' } }));
    expect(line.endsWith('\n')).toBe(true);
    expect(line.indexOf('\n')).toBe(line.length - 1);
    expect(line).toBe('{"jsonrpc":"2.0","id":7,"result":{"nested":{"text":"a\\nb"}}}\n');
  });

  it('serializes an error with a data payload and a null id', () => {
    const line = serializeMessage(buildError(null, JSONRPC_INVALID_REQUEST, 'Bad', { code: 'X' }));
    expect(line).toBe('{"jsonrpc":"2.0","id":null,"error":{"code":-32600,"message":"Bad","data":{"code":"X"}}}\n');
  });

  it('omits the data member when no detail is attached', () => {
    expect(serializeMessage(buildError(1, -32603, 'Boom'))).toBe(
      '{"jsonrpc":"2.0","id":1,"error":{"code":-32603,"message":"Boom"}}\n',
    );
  });

  it('serializes a notification without an id', () => {
    expect(serializeMessage(buildNotification('$/progress', { done: 1 }))).toBe(
      '{"jsonrpc":"2.0","method":"$/progress","params":{"done":1}}\n',
    );
    expect(serializeMessage(buildNotification('$/noop'))).toBe('{"jsonrpc":"2.0","method":"$/noop"}\n');
  });
});

describe('serve protocol — parseLine', () => {
  it('parses a request into a normalized message', () => {
    const r = parseLine('{"jsonrpc":"2.0","id":3,"method":"ping","params":{"x":1}}');
    expect(r).toEqual({ frame: 'message', message: { id: 3, method: 'ping', params: { x: 1 } } });
  });

  it('treats a missing id as a notification (id null)', () => {
    const r = parseLine('{"jsonrpc":"2.0","method":"exit"}');
    expect(r).toEqual({ frame: 'message', message: { id: null, method: 'exit', params: undefined } });
  });

  it('reports unparseable JSON as parse_error (never throws)', () => {
    expect(parseLine('{not json').frame).toBe('parse_error');
    expect(parseLine('').frame).toBe('parse_error');
  });

  it('reports well-formed JSON that is not a JSON-RPC request as invalid_request', () => {
    expect(parseLine('null')).toEqual({ frame: 'invalid_request', id: null });
    expect(parseLine('[1,2,3]')).toEqual({ frame: 'invalid_request', id: null });
    expect(parseLine('"just a string"')).toEqual({ frame: 'invalid_request', id: null });
    expect(parseLine('{"jsonrpc":"2.0"}')).toEqual({ frame: 'invalid_request', id: null });
    expect(parseLine('{"id":9,"method":"x"}')).toEqual({ frame: 'invalid_request', id: 9 });
    expect(parseLine('{"jsonrpc":"2.0","id":9,"method":42}')).toEqual({ frame: 'invalid_request', id: 9 });
  });
});
