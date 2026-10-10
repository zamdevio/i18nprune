import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliSpawnEnv } from '../helpers/cliEnv.js';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/sample-i18n');

/** Spawn `serve` and drive a JSON-RPC exchange over real pipes. */
function spawnServe(args: string[], cwd: string) {
  const child = spawn(process.execPath, [cliJs, 'serve', ...args], {
    cwd,
    env: cliSpawnEnv({ I18NPRUNE_NO_UPDATE_CHECK: '1' }),
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

/** One request/response round-trip against a fresh serve process. */
async function callServe(method: string, options?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const h = spawnServe(['--project', fixture], fixture);
  h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
  await waitFor(() => h.frames().length >= 1);
  h.send({ jsonrpc: '2.0', id: 2, method, params: { options: options ?? {} } });
  await waitFor(() => h.frames().length >= 2);
  const result = (JSON.parse(h.frames()[1]!) as { result: Record<string, unknown> }).result;
  h.child.stdin.end();
  await h.exited;
  return result;
}

/** CLI stdout for `--json`, with the same test env. */
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
  });

  it('op.validate returns the same envelope bytes as `validate --json`', async () => {
    const viaServe = await callServe('op.validate');
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

  it('op.config matches `config --json` (modulo the host run flags)', async () => {
    const viaServe = (await callServe('op.config')) as { data: { run: unknown } };
    const viaCli = JSON.parse(runCliJson(['config'])) as { data: { run: unknown } };
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
});
