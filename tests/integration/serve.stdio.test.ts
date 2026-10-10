import { beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliSpawnEnv } from '../helpers/cliEnv.js';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/sample-i18n');

/** Collect raw stdout/stderr bytes plus per-line protocol frames. */
function spawnServe(args: string[], cwd: string) {
  const child = spawn(process.execPath, [cliJs, 'serve', ...args], {
    cwd,
    env: cliSpawnEnv({ I18NPRUNE_NO_UPDATE_CHECK: '1' }),
  }) as ChildProcessWithoutNullStreams;

  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  child.stdout.on('data', (c: Buffer) => stdoutChunks.push(c));
  child.stderr.on('data', (c: Buffer) => stderrChunks.push(c));
  const exited = new Promise<number>((resolve) => child.on('exit', (code) => resolve(code ?? 0)));

  return {
    child,
    exited,
    send: (msg: unknown) => child.stdin.write(`${JSON.stringify(msg)}\n`),
    rawOut: () => Buffer.concat(stdoutChunks).toString('utf8'),
    stderr: () => Buffer.concat(stderrChunks).toString('utf8'),
    frames: () => Buffer.concat(stdoutChunks).toString('utf8').split('\n').filter((l) => l !== ''),
  };
}

/** Wait until `predicate` holds or the deadline passes. */
async function waitFor(predicate: () => boolean, ms = 4000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error('waitFor timed out');
}

describe('i18nprune serve — real stdio transport', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliJs)) {
      throw new Error('Missing dist/cli.js — run `pnpm cli:build` before `pnpm test`.');
    }
  });

  it('handshakes over pipes and keeps stdout byte-clean (protocol-only)', async () => {
    const h = spawnServe(['--project', fixture], root);
    h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
    await waitFor(() => h.frames().length >= 1);

    const [first] = h.frames();
    const msg = JSON.parse(first!) as { jsonrpc: string; id: number; result: Record<string, unknown> };
    expect(msg.jsonrpc).toBe('2.0');
    expect(msg.id).toBe(1);
    expect(msg.result.rootMode).toBe('sandbox');
    expect(msg.result.protocolVersion).toBe('1');
    expect(msg.result.projectRoot).toBe(path.resolve(fixture));

    h.send({ jsonrpc: '2.0', id: 2, method: 'ping' });
    await waitFor(() => h.frames().length >= 2);
    expect(JSON.parse(h.frames()[1]!)).toEqual({ jsonrpc: '2.0', id: 2, result: {} });

    // Every stdout line must be one parseable protocol object — no banner, no update notice, no log.
    for (const line of h.frames()) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
    // The banner would print "I18nprune"; assert its absence on the protocol stream specifically.
    expect(h.rawOut()).not.toMatch(/I18nprune|\[i18nprune\]/);

    // stdin close is the primary stop signal.
    h.child.stdin.end();
    await expect(h.exited).resolves.toBe(0);
  });

  it('fails closed on an unsupported protocol version end-to-end', async () => {
    const h = spawnServe(['--project', fixture], root);
    h.send({ jsonrpc: '2.0', id: 5, method: 'initialize', params: { protocolVersion: '99' } });
    await waitFor(() => h.frames().length >= 1);

    const err = (JSON.parse(h.frames()[0]!) as { error: { code: number; data: { code: string } } }).error;
    expect(err.code).toBe(-32602);
    expect(err.data.code).toBe('SERVE_UNSUPPORTED_PROTOCOL_VERSION');

    h.child.stdin.end();
    await expect(h.exited).resolves.toBe(0);
  });

  it('hub mode requires a root per request and reports rootMode hub', async () => {
    const h = spawnServe([], root);
    h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
    await waitFor(() => h.frames().length >= 1);
    const res = (JSON.parse(h.frames()[0]!) as { result: Record<string, unknown> }).result;
    expect(res.rootMode).toBe('hub');
    expect(res.projectRoot).toBeNull();

    h.child.stdin.end();
    await expect(h.exited).resolves.toBe(0);
  });
});
