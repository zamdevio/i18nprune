import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ServeSession, type ServeIo } from '@/serve/session.js';
import { SERVE_PROTOCOL_VERSION } from '@/serve/constants.js';
import type { ServeRootConfig } from '@/serve/roots.js';

/** Capture the two channels so purity is asserted directly, not inferred. */
function makeHarness(opts?: {
  root?: ServeRootConfig;
  writes?: boolean;
  idleTimeoutSeconds?: number;
}) {
  const out: Buffer[] = [];
  const err: Buffer[] = [];
  const exits: number[] = [];
  const io = {
    writeStdout: (chunk) => out.push(Buffer.from(chunk, 'utf8')),
    writeStderr: (chunk) => err.push(Buffer.from(chunk, 'utf8')),
  } satisfies ServeIo;
  const session = new ServeSession({
    root: opts?.root ?? { mode: 'hub' },
    writes: opts?.writes ?? false,
    idleTimeoutSeconds: opts?.idleTimeoutSeconds ?? 0,
    io,
    exit: (code) => exits.push(code),
    setTimer: (cb, ms) => setTimeout(cb, ms),
    clearTimer: (t) => clearTimeout(t),
  });
  return {
    session,
    io,
    exits,
    stdout: () => Buffer.concat(out).toString('utf8'),
    stderr: () => Buffer.concat(err).toString('utf8'),
    lines: () => Buffer.concat(out).toString('utf8').split('\n').filter((l) => l !== ''),
  };
}

const send = (h: ReturnType<typeof makeHarness>, msg: unknown) =>
  h.session.handleChunk(Buffer.from(`${JSON.stringify(msg)}\n`, 'utf8'));

function parse(line: string): Record<string, unknown> {
  return JSON.parse(line) as Record<string, unknown>;
}

describe('ServeSession — handshake', () => {
  it('initializes with the negotiated protocol, truthful capabilities, and mode', () => {
    const h = makeHarness({ root: { mode: 'sandbox', root: path.resolve('/srv/proj') }, writes: true });
    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    const [line] = h.lines();
    const res = parse(line!).result as Record<string, unknown>;
    expect(res.protocolVersion).toBe(SERVE_PROTOCOL_VERSION);
    expect(res.rootMode).toBe('sandbox');
    expect(res.projectRoot).toBe(path.resolve('/srv/proj'));
    expect(res.capabilities).toEqual({ ops: [], progress: false, cancel: false, writes: true });
  });

  it('fails closed on an unsupported protocol version and does not mark the session initialized', () => {
    const h = makeHarness();
    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2' } });
    const err = parse(h.lines()[0]!).error as Record<string, unknown>;
    expect(err.code).toBe(-32602);
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_UNSUPPORTED_PROTOCOL_VERSION');

    send(h, { jsonrpc: '2.0', id: 2, method: 'ping' });
    const second = parse(h.lines()[1]!).error as Record<string, unknown>;
    expect((second.data as Record<string, unknown>).code).toBe('SERVE_NOT_INITIALIZED');
  });

  it('requires a string protocolVersion', () => {
    const h = makeHarness();
    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    const err = parse(h.lines()[0]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_INVALID_PARAMS');
  });

  it('rejects a second initialize', () => {
    const h = makeHarness();
    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    send(h, { jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    const err = parse(h.lines()[1]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_INVALID_REQUEST');
  });
});

describe('ServeSession — pre-init guard', () => {
  it('refuses ping/shutdown before initialize', () => {
    const h = makeHarness();
    send(h, { jsonrpc: '2.0', id: 1, method: 'ping' });
    send(h, { jsonrpc: '2.0', id: 2, method: 'shutdown' });
    for (const line of h.lines()) {
      const err = parse(line).error as Record<string, unknown>;
      expect((err.data as Record<string, unknown>).code).toBe('SERVE_NOT_INITIALIZED');
    }
  });
});

describe('ServeSession — utility + unknown methods', () => {
  it('answers ping with an empty result', () => {
    const h = makeHarness();
    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    send(h, { jsonrpc: '2.0', id: 2, method: 'ping' });
    expect(parse(h.lines()[1]!)).toEqual({ jsonrpc: '2.0', id: 2, result: {} });
  });

  it('returns method-not-found for an op method with no slice wired yet', () => {
    const h = makeHarness();
    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    send(h, { jsonrpc: '2.0', id: 2, method: 'op.validate' });
    const err = parse(h.lines()[1]!).error as Record<string, unknown>;
    expect(err.code).toBe(-32601);
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_METHOD_NOT_FOUND');
  });
});

describe('ServeSession — lifecycle', () => {
  it('exits 0 when stdin closes', () => {
    const h = makeHarness();
    h.session.handleStdinClosed();
    expect(h.exits).toEqual([0]);
    expect(h.stderr()).toContain('stdin closed');
  });

  it('exits on the `exit` notification without replying', () => {
    const h = makeHarness();
    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    const before = h.lines().length;
    send(h, { jsonrpc: '2.0', method: 'exit' });
    expect(h.lines().length).toBe(before);
    expect(h.exits).toEqual([0]);
  });

  it('shutdown drains and waits for exit: replies null then still alive until exit', () => {
    const h = makeHarness();
    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    send(h, { jsonrpc: '2.0', id: 2, method: 'shutdown' });
    expect(parse(h.lines()[1]!).result).toEqual({});
    expect(h.exits).toEqual([]);

    send(h, { jsonrpc: '2.0', id: 3, method: 'ping' });
    const err = parse(h.lines()[2]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_SHUTTING_DOWN');

    send(h, { jsonrpc: '2.0', method: 'exit' });
    expect(h.exits).toEqual([0]);
  });
});

describe('ServeSession — stdio purity', () => {
  it('writes only protocol frames to stdout across a full exchange', () => {
    const h = makeHarness();
    h.session.start();
    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    send(h, { jsonrpc: '2.0', id: 2, method: 'ping' });
    send(h, { jsonrpc: '2.0', id: 3, method: 'nope' });
    send(h, { not: 'jsonrpc' });
    h.session.handleChunk(Buffer.from('{ broken\n', 'utf8'));
    h.session.handleStdinClosed();

    for (const line of h.lines()) {
      const obj = parse(line) as Record<string, unknown>;
      expect(obj.jsonrpc === '2.0' || 'error' in obj).toBe(true);
    }
    // Diagnostics exist, but only on stderr — never on the protocol stream.
    expect(h.stderr().length).toBeGreaterThan(0);
  });

  it('tolerates CRLF line endings', () => {
    const h = makeHarness();
    h.session.handleChunk(Buffer.from('{"jsonrpc":"2.0","id":1,"method":"ping"}\r\n', 'utf8'));
    // pre-init → not-initialized error, but the frame must have parsed (proving \r was stripped)
    const err = parse(h.lines()[0]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_NOT_INITIALIZED');
  });

  it('answers an oversize line with a parse-level rejection and keeps serving', () => {
    const h = makeHarness();
    const huge = Buffer.from(`${'x'.repeat(17 * 1024 * 1024)}\n`, 'utf8');
    h.session.handleChunk(huge);
    const err = parse(h.lines()[0]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_LINE_TOO_LONG');

    send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    expect(parse(h.lines()[1]!).result).toBeDefined();
  });
});

describe('ServeSession — root confinement (wired for S.2)', () => {
  it('sandbox: a different root is refused', () => {
    const root = path.resolve('/srv/proj');
    const h = makeHarness({ root: { mode: 'sandbox', root } });
    expect(h.session.resolveRoot()).toBe(root);
    expect(h.session.resolveRoot(root)).toBe(root);
    expect(() => h.session.resolveRoot(path.resolve('/srv/other'))).toThrow(/outside this sandboxed session/);
  });

  it('hub: a missing or relative root is refused', () => {
    const h = makeHarness();
    expect(() => h.session.resolveRoot()).toThrow(/required in hub mode/);
    expect(() => h.session.resolveRoot('rel')).toThrow(/must be absolute/);
    expect(h.session.resolveRoot(path.resolve('/home/me/proj'))).toBe(path.resolve('/home/me/proj'));
  });
});
