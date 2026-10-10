import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliSpawnEnv } from '../helpers/cliEnv.js';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/sample-i18n');

/**
 * Serve is launched from a config-less temp cwd on purpose: the direct CLI resolves the fixture's
 * config from its own cwd, so if serve leaked the process-global implicit config memo this cwd would
 * hand it the wrong (or no) answer. Spawning here is what makes that regression observable.
 */
let neutralCwd: string;

/** Spawn `serve` and drive a JSON-RPC exchange over real pipes. */
function spawnServe(args: string[], cwd: string, extraEnv?: NodeJS.ProcessEnv) {
  const child = spawn(process.execPath, [cliJs, 'serve', ...args], {
    cwd,
    env: cliSpawnEnv({ I18NPRUNE_NO_UPDATE_CHECK: '1', ...extraEnv }),
  }) as ChildProcessWithoutNullStreams;
  const out: Buffer[] = [];
  child.stdout.on('data', (c: Buffer) => out.push(c));
  child.stderr.resume();
  const exited = new Promise<number>((resolve) => child.on('exit', (code) => resolve(code ?? 0)));
  return {
    child,
    exited,
    send: (msg: unknown) => child.stdin.write(`${JSON.stringify(msg)}\n`),
    frames: () => Buffer.concat(out).toString('utf8').split('\n').filter((l) => l !== ''),
  };
}

async function waitFor(predicate: () => boolean, ms = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** One request/response round-trip against a fresh serve process, from the config-less cwd. */
async function callServe(method: string, options?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const h = spawnServe(['--project', fixture], neutralCwd);
  h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
  await waitFor(() => h.frames().length >= 1);
  h.send({ jsonrpc: '2.0', id: 2, method, params: { options: options ?? {} } });
  // Progress ops (`validate`) emit `$/progress` frames first; select the result by id.
  const isResult = (l: string) => (JSON.parse(l) as { id?: number }).id === 2;
  await waitFor(() => h.frames().some(isResult));
  const result = (JSON.parse(h.frames().find(isResult)!) as { result: Record<string, unknown> }).result;
  h.child.stdin.end();
  await h.exited;
  return result;
}

/** CLI stdout for `--json`, run inside the fixture so the direct CLI resolves its own config. */
function runCliJson(args: string[]): string {
  return execFileSync(process.execPath, [cliJs, ...args, '--json'], {
    cwd: fixture,
    encoding: 'utf8',
    env: cliSpawnEnv({ I18NPRUNE_NO_UPDATE_CHECK: '1' }),
  });
}

describe('i18nprune serve — read ops match CLI --json bytes (S.2)', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliJs)) {
      throw new Error('Missing dist/cli.js — run `pnpm cli:build` before `pnpm test`.');
    }
    neutralCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-serve-cwd-'));
  });

  afterAll(() => {
    fs.rmSync(neutralCwd, { recursive: true, force: true });
  });

  it('op.validate returns the same envelope bytes as `validate --json`, with the fixture config loaded', async () => {
    const viaServe = await callServe('op.validate');
    // Guard the multi-root regression directly: serve must load the *request root's* config, not a
    // stale process-global answer (the neutral cwd has no config to leak).
    expect((viaServe as { meta: { cwd: string } }).meta.cwd).toBe(fixture);
    // The CLI envelope is pretty-printed multi-line; the serve result is the parsed object.
    const viaCli = JSON.parse(runCliJson(['validate']));
    expect(viaServe).toEqual(viaCli);
  });

  it('op.providers matches `providers --json`', async () => {
    const viaServe = await callServe('op.providers');
    expect(viaServe).toEqual(JSON.parse(runCliJson(['providers'])));
  });

  it('op.languages matches `languages --json`', async () => {
    const viaServe = await callServe('op.languages');
    expect(viaServe).toEqual(JSON.parse(runCliJson(['languages'])));
  });

  it('op.config matches `config --json` (modulo the host run flags) and loads the root config', async () => {
    const viaServe = (await callServe('op.config')) as {
      data: { run: unknown; configFileLoaded: boolean; configPath: string | null };
    };
    const viaCli = JSON.parse(runCliJson(['config'])) as { data: { run: unknown } };
    // The fixture config must be the one loaded, not a leaked global answer.
    expect(viaServe.data.configFileLoaded).toBe(true);
    expect(viaServe.data.configPath).toBe(path.join(fixture, 'i18nprune.config.mjs'));
    // The snapshot embeds `run` (`getRunOptions()`), which truthfully reflects *this* process.
    // serve must run quiet+silent to keep stdout pure, so those two booleans legitimately differ;
    // every other byte — config, paths, fieldSources, env, cliVersion — must match exactly.
    const cliRun = viaCli.data.run as Record<string, unknown>;
    expect(viaServe.data.run).toEqual({ ...cliRun, quiet: true, silent: true });
    expect({ ...viaServe, data: { ...viaServe.data, run: null } }).toEqual({
      ...viaCli,
      data: { ...viaCli.data, run: null },
    });
  });

  it('op.doctor matches `doctor --json`', async () => {
    const viaServe = await callServe('op.doctor');
    expect(viaServe).toEqual(JSON.parse(runCliJson(['doctor'])));
  });

  it('advertises the read ops in capabilities.ops', async () => {
    const h = spawnServe(['--project', fixture], fixture);
    h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
    await waitFor(() => h.frames().length >= 1);
    const res = (JSON.parse(h.frames()[0]!) as { result: { capabilities: { ops: string[] } } }).result;
    expect(res.capabilities.ops).toEqual(['config', 'doctor', 'validate', 'languages', 'providers']);
    h.child.stdin.end();
    await h.exited;
  });

  it('streams $/progress for op.validate and still returns the envelope', async () => {
    const h = spawnServe(['--project', fixture], neutralCwd);
    h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
    await waitFor(() => h.frames().length >= 1);
    h.send({ jsonrpc: '2.0', id: 7, method: 'op.validate', params: { options: {} } });
    await waitFor(() => h.frames().some((l) => (JSON.parse(l) as { id?: number }).id === 7));
    h.child.stdin.end();
    await h.exited;

    const frames = h.frames().map((l) => JSON.parse(l) as Record<string, any>);
    const progress = frames.filter((f) => f.method === '$/progress');
    expect(progress.length).toBeGreaterThan(0);
    // Every progress frame is keyed to the request id and carries a verbatim `run.*` event.
    expect(progress.every((f) => f.params.id === 7 && typeof f.params.event.type === 'string')).toBe(true);

    const result = frames.find((f) => f.id === 7)!;
    expect(result.result.kind).toBe('validate');
  });

  it('does not stream progress for a non-progress op (op.config)', async () => {
    const h = spawnServe(['--project', fixture], neutralCwd);
    h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
    await waitFor(() => h.frames().length >= 1);
    h.send({ jsonrpc: '2.0', id: 2, method: 'op.config', params: { options: {} } });
    await waitFor(() => h.frames().some((l) => (JSON.parse(l) as { id?: number }).id === 2));
    h.child.stdin.end();
    await h.exited;

    const frames = h.frames().map((l) => JSON.parse(l) as Record<string, any>);
    expect(frames.some((f) => f.method === '$/progress')).toBe(false);
    expect(frames.find((f) => f.id === 2)!.result.kind).toBe('config');
  });

  it('a read-only session writes nothing to disk; --allow-writes does', async () => {
    const runOp = async (extraArgs: string[], extraEnv: NodeJS.ProcessEnv) => {
      const h = spawnServe(['--project', fixture, ...extraArgs], neutralCwd, extraEnv);
      h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
      await waitFor(() => h.frames().length >= 1);
      h.send({ jsonrpc: '2.0', id: 2, method: 'op.validate', params: { options: {} } });
      await waitFor(() => h.frames().length >= 2);
      h.child.stdin.end();
      await h.exited;
    };

    const roHome = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-ro-'));
    const rwHome = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-rw-'));
    try {
      await runOp([], { I18NPRUNE_HOME: roHome });
      // Read-only: no cache file or directory at all — not even the project dir.
      expect(fs.existsSync(path.join(roHome, 'cache'))).toBe(false);

      await runOp(['--allow-writes'], { I18NPRUNE_HOME: rwHome });
      expect(fs.existsSync(path.join(rwHome, 'cache'))).toBe(true);
    } finally {
      fs.rmSync(roHome, { recursive: true, force: true });
      fs.rmSync(rwHome, { recursive: true, force: true });
    }
  });
});
