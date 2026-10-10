import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ServeSession, type ServeIo } from '@/serve/session.js';
import { SERVE_PROTOCOL_VERSION } from '@/constants/serve.js';
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

/** Feed a message and flush the dispatch queue so the reply is observable. */
const send = async (h: ReturnType<typeof makeHarness>, msg: unknown) => {
  h.session.handleChunk(Buffer.from(`${JSON.stringify(msg)}\n`, 'utf8'));
  await h.session.drain();
};

function parse(line: string): Record<string, unknown> {
  return JSON.parse(line) as Record<string, unknown>;
}

const init = (h: ReturnType<typeof makeHarness>) =>
  send(h, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: SERVE_PROTOCOL_VERSION },
  });

describe('ServeSession — handshake', () => {
  it('initializes with the negotiated protocol, truthful capabilities, and mode', async () => {
    const h = makeHarness({ root: { mode: 'sandbox', root: path.resolve('/srv/proj') }, writes: true });
    await init(h);
    const res = parse(h.lines()[0]!).result as Record<string, unknown>;
    expect(res.protocolVersion).toBe(SERVE_PROTOCOL_VERSION);
    expect(res.rootMode).toBe('sandbox');
    expect(res.projectRoot).toBe(path.resolve('/srv/proj'));
    expect(res.capabilities).toEqual({
      ops: ['config', 'doctor', 'validate', 'languages', 'providers', 'sync', 'generate'],
      progress: true,
      progressOps: ['validate', 'sync', 'generate'],
      writeOps: ['sync', 'generate'],
      cancelScope: 'queued',
      writes: true,
    });
  });

  it('fails closed on an unsupported protocol version and does not mark the session initialized', async () => {
    const h = makeHarness();
    await send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2' } });
    const err = parse(h.lines()[0]!).error as Record<string, unknown>;
    expect(err.code).toBe(-32602);
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_UNSUPPORTED_PROTOCOL_VERSION');

    await send(h, { jsonrpc: '2.0', id: 2, method: 'ping' });
    const second = parse(h.lines()[1]!).error as Record<string, unknown>;
    expect((second.data as Record<string, unknown>).code).toBe('SERVE_NOT_INITIALIZED');
  });

  it('requires a string protocolVersion', async () => {
    const h = makeHarness();
    await send(h, { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    const err = parse(h.lines()[0]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_INVALID_PARAMS');
  });

  it('rejects a second initialize', async () => {
    const h = makeHarness();
    await init(h);
    await send(h, { jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: SERVE_PROTOCOL_VERSION } });
    const err = parse(h.lines()[1]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_INVALID_REQUEST');
  });
});

describe('ServeSession — pre-init guard', () => {
  it('refuses ping/shutdown before initialize', async () => {
    const h = makeHarness();
    await send(h, { jsonrpc: '2.0', id: 1, method: 'ping' });
    await send(h, { jsonrpc: '2.0', id: 2, method: 'shutdown' });
    for (const line of h.lines()) {
      const err = parse(line).error as Record<string, unknown>;
      expect((err.data as Record<string, unknown>).code).toBe('SERVE_NOT_INITIALIZED');
    }
  });
});

describe('ServeSession — utility + unknown methods', () => {
  it('answers ping with an empty result', async () => {
    const h = makeHarness();
    await init(h);
    await send(h, { jsonrpc: '2.0', id: 2, method: 'ping' });
    expect(parse(h.lines()[1]!)).toEqual({ jsonrpc: '2.0', id: 2, result: {} });
  });

  it('returns method-not-found for an op method that has no slice', async () => {
    const h = makeHarness();
    await init(h);
    await send(h, { jsonrpc: '2.0', id: 2, method: 'op.review' });
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

  it('exits on the `exit` notification without replying', async () => {
    const h = makeHarness();
    await init(h);
    const before = h.lines().length;
    await send(h, { jsonrpc: '2.0', method: 'exit' });
    expect(h.lines().length).toBe(before);
    expect(h.exits).toEqual([0]);
  });

  it('shutdown drains and waits for exit: replies then still alive until exit', async () => {
    const h = makeHarness();
    await init(h);
    await send(h, { jsonrpc: '2.0', id: 2, method: 'shutdown' });
    expect(parse(h.lines()[1]!).result).toEqual({});
    expect(h.exits).toEqual([]);

    await send(h, { jsonrpc: '2.0', id: 3, method: 'ping' });
    const err = parse(h.lines()[2]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_SHUTTING_DOWN');

    await send(h, { jsonrpc: '2.0', method: 'exit' });
    expect(h.exits).toEqual([0]);
  });
});

describe('ServeSession — stdio purity', () => {
  it('writes only protocol frames to stdout across a full exchange', async () => {
    const h = makeHarness();
    h.session.start();
    await init(h);
    await send(h, { jsonrpc: '2.0', id: 2, method: 'ping' });
    await send(h, { jsonrpc: '2.0', id: 3, method: 'nope' });
    h.session.handleChunk(Buffer.from('{ not jsonrpc }\n', 'utf8'));
    await h.session.drain();
    h.session.handleChunk(Buffer.from('{ broken\n', 'utf8'));
    await h.session.drain();
    h.session.handleStdinClosed();

    for (const line of h.lines()) {
      const obj = parse(line) as Record<string, unknown>;
      expect(obj.jsonrpc === '2.0' || 'error' in obj).toBe(true);
    }
    // Diagnostics exist, but only on stderr — never on the protocol stream.
    expect(h.stderr().length).toBeGreaterThan(0);
  });

  it('tolerates CRLF line endings', async () => {
    const h = makeHarness();
    h.session.handleChunk(Buffer.from('{"jsonrpc":"2.0","id":1,"method":"ping"}\r\n', 'utf8'));
    await h.session.drain();
    // pre-init → not-initialized error, but the frame must have parsed (proving \r was stripped)
    const err = parse(h.lines()[0]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_NOT_INITIALIZED');
  });

  it('answers an oversize line with a parse-level rejection and keeps serving', async () => {
    const h = makeHarness();
    const huge = Buffer.from(`${'x'.repeat(17 * 1024 * 1024)}\n`, 'utf8');
    h.session.handleChunk(huge);
    const err = parse(h.lines()[0]!).error as Record<string, unknown>;
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_LINE_TOO_LONG');

    await init(h);
    expect(parse(h.lines()[1]!).result).toBeDefined();
  });
});

describe('ServeSession — op routing (S.2)', () => {
  it('hub: an op without projectRoot is invalid params', async () => {
    const h = makeHarness();
    await init(h);
    await send(h, { jsonrpc: '2.0', id: 2, method: 'op.config' });
    const err = parse(h.lines()[1]!).error as Record<string, unknown>;
    expect(err.code).toBe(-32602);
  });

  it('sandbox: an op naming a different root is confined', async () => {
    const root = path.resolve('/srv/proj');
    const h = makeHarness({ root: { mode: 'sandbox', root } });
    await init(h);
    await send(h, {
      jsonrpc: '2.0',
      id: 2,
      method: 'op.config',
      params: { projectRoot: path.resolve('/srv/other') },
    });
    const err = parse(h.lines()[1]!).error as Record<string, unknown>;
    expect(err.code).toBe(-32600);
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_PROJECT_CONFINED');
  });

  it('hub: op.languages needs no project config and returns its envelope', async () => {
    const h = makeHarness();
    await init(h);
    await send(h, {
      jsonrpc: '2.0',
      id: 2,
      method: 'op.languages',
      params: { projectRoot: path.resolve('/tmp'), options: { table: false } },
    });
    const result = parse(h.lines()[1]!).result as { kind: string; ok: boolean };
    expect(result.kind).toBe('languages');
    expect(result.ok).toBe(true);
  });
});

describe('ServeSession — progress + cancel (S.3)', () => {
  it('refuses a request cancelled before dispatch, and keeps serving', async () => {
    const h = makeHarness();
    await init(h);
    // Both lines in one chunk: the request is enqueued, then cancelled before its microtask runs.
    h.session.handleChunk(
      Buffer.from(
        `${JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'op.config',
          params: { projectRoot: path.resolve('/tmp') },
        })}\n${JSON.stringify({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: 2 } })}\n`,
        'utf8',
      ),
    );
    await h.session.drain();
    const err = parse(h.lines()[1]!).error as Record<string, unknown>;
    expect(err.code).toBe(-32600);
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_REQUEST_CANCELLED');

    await send(h, { jsonrpc: '2.0', id: 3, method: 'ping' });
    expect(parse(h.lines()[2]!).result).toEqual({});
  });

  it('ignores $/cancelRequest for an unknown id', async () => {
    const h = makeHarness();
    await init(h);
    await send(h, { jsonrpc: '2.0', method: '$/cancelRequest', params: { id: 999 } });
    // A notification produces no reply: only the init result is on stdout.
    expect(h.lines().length).toBe(1);
    await send(h, { jsonrpc: '2.0', id: 2, method: 'ping' });
    expect(parse(h.lines()[1]!).result).toEqual({});
  });
});

describe('ServeSession — write gating (S.4)', () => {
  it('refuses a write op on a read-only session with SERVE_WRITES_DISABLED', async () => {
    const h = makeHarness({ writes: false });
    await init(h);
    await send(h, {
      jsonrpc: '2.0',
      id: 2,
      method: 'op.sync',
      params: { projectRoot: path.resolve('/tmp'), options: {} },
    });
    const err = parse(h.lines()[1]!).error as Record<string, unknown>;
    expect(err.code).toBe(-32600);
    expect((err.data as Record<string, unknown>).code).toBe('SERVE_WRITES_DISABLED');
  });

  it('lets a write op through on a write session', async () => {
    const h = makeHarness({ writes: true });
    await init(h);
    await send(h, {
      jsonrpc: '2.0',
      id: 2,
      method: 'op.sync',
      params: { projectRoot: path.resolve('/tmp'), options: { dryRun: true } },
    });
    const result = parse(h.lines()[1]!).result as { kind?: string };
    expect(result.kind).toBe('sync');
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
