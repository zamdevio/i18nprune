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
const fixturesDir = path.join(root, 'tests/fixtures');

/**
 * Copy the whole `tests/fixtures` tree into a temp dir and return the `sample-i18n` root. The tree
 * (not just the fixture) is copied because `i18nprune.config.mjs` imports `../shared/fixtureTranslate.mjs`.
 * Only used by write tests, which mutate locale files and must not touch the checked-in fixture.
 */
function copyFixtureTree(): { tmp: string; projectRoot: string } {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-fixtures-'));
  fs.cpSync(fixturesDir, tmp, { recursive: true });
  return { tmp, projectRoot: path.join(tmp, 'sample-i18n') };
}

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

/** Deep-clone dropping every `durationMs` key, so wall-clock timing does not fail a structural compare. */
function stripTiming(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripTiming);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'durationMs') continue;
      out[k] = stripTiming(v);
    }
    return out;
  }
  return value;
}

async function waitFor(predicate: () => boolean, ms = 5000): Promise<void> {  const start = Date.now();
  while (Date.now() - start < ms) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** One request/response round-trip against a fresh serve process, from the config-less cwd. */
async function callServe(
  method: string,
  options?: Record<string, unknown>,
  extraArgs: string[] = [],
): Promise<Record<string, unknown>> {
  const h = spawnServe(['--project', fixture, ...extraArgs], neutralCwd);
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
    expect(res.capabilities.ops).toEqual(['config', 'doctor', 'validate', 'languages', 'providers', 'sync', 'generate', 'cleanup']);
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

  it('op.sync is refused on a read-only session and writes nothing', async () => {
    const { tmp, projectRoot } = copyFixtureTree();
    try {
      const fr = path.join(projectRoot, 'locales', 'fr.json');
      const frObj = JSON.parse(fs.readFileSync(fr, 'utf8')) as Record<string, unknown>;
      delete frObj.help; // introduce drift sync would otherwise repair
      const drifted = `${JSON.stringify(frObj, null, 2)}\n`;
      fs.writeFileSync(fr, drifted);

      const h = spawnServe(['--project', projectRoot], neutralCwd);
      h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
      await waitFor(() => h.frames().length >= 1);
      h.send({ jsonrpc: '2.0', id: 2, method: 'op.sync', params: { options: {} } });
      await waitFor(() => h.frames().some((l) => (JSON.parse(l) as { id?: number }).id === 2));
      h.child.stdin.end();
      await h.exited;

      const err = (JSON.parse(h.frames().find((l) => (JSON.parse(l) as { id?: number }).id === 2)!) as {
        error: { data: { code: string } };
      }).error;
      expect(err.data.code).toBe('SERVE_WRITES_DISABLED');
      // The refusal happened before any write: the drifted file is untouched.
      expect(fs.readFileSync(fr, 'utf8')).toBe(drifted);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('op.sync actually writes locale files when the session has --allow-writes', async () => {
    const { tmp, projectRoot } = copyFixtureTree();
    try {
      const fr = path.join(projectRoot, 'locales', 'fr.json');
      const frObj = JSON.parse(fs.readFileSync(fr, 'utf8')) as Record<string, unknown>;
      delete frObj.help;
      const drifted = `${JSON.stringify(frObj, null, 2)}\n`;
      fs.writeFileSync(fr, drifted);

      const h = spawnServe(['--project', projectRoot, '--allow-writes'], neutralCwd);
      h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
      await waitFor(() => h.frames().length >= 1);
      h.send({ jsonrpc: '2.0', id: 2, method: 'op.sync', params: { options: {} } });
      await waitFor(() => h.frames().some((l) => (JSON.parse(l) as { id?: number }).id === 2));
      h.child.stdin.end();
      await h.exited;

      const result = (JSON.parse(h.frames().find((l) => (JSON.parse(l) as { id?: number }).id === 2)!) as {
        result: { kind: string; data: { writtenFiles: number } };
      }).result;
      expect(result.kind).toBe('sync');
      expect(result.data.writtenFiles).toBe(1);
      // The write landed on disk: the dropped namespace came back.
      expect(fs.readFileSync(fr, 'utf8')).not.toBe(drifted);
      expect(fs.readFileSync(fr, 'utf8')).toContain('help');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('op.generate --dry-run matches `generate --json --dry-run --target ar` (modulo timing)', async () => {
    const viaServe = await callServe('op.generate', { dryRun: true, target: 'ar', metadata: true }, ['--allow-writes']);
    const viaCli = JSON.parse(runCliJson(['generate', '--dry-run', '--target', 'ar', '--metadata']));
    // `durationMs` is wall-clock; strip it everywhere before comparing structure.
    expect(stripTiming(viaServe)).toEqual(stripTiming(viaCli));
  });

  it('op.generate is refused on a read-only session', async () => {
    const h = spawnServe(['--project', fixture], neutralCwd);
    h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
    await waitFor(() => h.frames().length >= 1);
    h.send({ jsonrpc: '2.0', id: 2, method: 'op.generate', params: { options: { dryRun: true, target: 'ar' } } });
    await waitFor(() => h.frames().some((l) => (JSON.parse(l) as { id?: number }).id === 2));
    h.child.stdin.end();
    await h.exited;
    const err = (JSON.parse(h.frames().find((l) => (JSON.parse(l) as { id?: number }).id === 2)!) as {
      error: { data: { code: string } };
    }).error;
    expect(err.data.code).toBe('SERVE_WRITES_DISABLED');
  });

  it('op.cleanup --dry-run matches `cleanup --json` structurally (modulo timing)', async () => {
    const viaServe = await callServe('op.cleanup', { dryRun: true }, ['--allow-writes']);
    const viaCli = JSON.parse(runCliJson(['cleanup']));
    expect(stripTiming(viaServe)).toEqual(stripTiming(viaCli));
  });

  it('op.cleanup removes an unused key when the session has --allow-writes', async () => {
    const { tmp, projectRoot } = copyFixtureTree();
    try {
      const en = path.join(projectRoot, 'locales', 'en.json');
      const obj = JSON.parse(fs.readFileSync(en, 'utf8')) as Record<string, unknown>;
      obj.definitely_unused_zzz = 'Nope';
      const before = `${JSON.stringify(obj, null, 2)}\n`;
      fs.writeFileSync(en, before);

      const h = spawnServe(['--project', projectRoot, '--allow-writes'], neutralCwd);
      h.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1' } });
      await waitFor(() => h.frames().length >= 1);
      h.send({ jsonrpc: '2.0', id: 2, method: 'op.cleanup', params: { options: {} } });
      await waitFor(() => h.frames().some((l) => (JSON.parse(l) as { id?: number }).id === 2));
      h.child.stdin.end();
      await h.exited;

      const result = (JSON.parse(h.frames().find((l) => (JSON.parse(l) as { id?: number }).id === 2)!) as {
        result: { kind: string; data: { wouldRemove: number } };
      }).result;
      expect(result.kind).toBe('cleanup');
      expect(result.data.wouldRemove).toBe(1);
      const after = fs.readFileSync(en, 'utf8');
      expect(after).not.toBe(before);
      expect(after).not.toContain('definitely_unused_zzz');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('a read-only session writes nothing to disk; --allow-writes does', async () => {    const runOp = async (extraArgs: string[], extraEnv: NodeJS.ProcessEnv) => {
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
