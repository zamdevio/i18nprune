import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { cliSpawnEnv } from '../helpers/cliEnv.js';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/sample-i18n');
const reportHtml = path.join(root, 'dist/report/index.html');
const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function runCli(args: string[], cwd: string = fixture): string {
  return execFileSync(process.execPath, [cliJs, ...args], {
    cwd,
    encoding: 'utf8',
    env: cliSpawnEnv(),
  });
}

function ensureReportHtmlBundle(): void {
  if (fs.existsSync(reportHtml)) return;
  execFileSync('pnpm', ['run', 'report:build'], { cwd: root, stdio: 'inherit' });
  execFileSync(process.execPath, ['scripts/report/build-assets.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
}

describe('report command', () => {
  it('writes project report JSON with kind i18nprune.projectReport', () => {
    const dir = makeTempDir('i18nprune-report-');
    const out = path.join(dir, 'out.json');
    runCli(['report', '--format', 'json', '--out', out]);
    const raw = fs.readFileSync(out, 'utf8');
    const j = JSON.parse(raw) as { kind?: string; schemaVersion?: number; summary?: { ok?: boolean } };
    expect(j.kind).toBe('i18nprune.projectReport');
    expect(j.schemaVersion).toBe(1);
    expect(typeof j.summary?.ok).toBe('boolean');
  });

  it('global --json prints CliJsonEnvelope on stdout and still writes --out', () => {
    const dir = makeTempDir('i18nprune-report-json-');
    const out = path.join(dir, 'out.json');
    const stdout = execFileSync(process.execPath, [cliJs, '--json', 'report', '--format', 'json', '--out', out], {
      cwd: fixture,
      encoding: 'utf8',
      env: cliSpawnEnv(),
    });
    const env = JSON.parse(stdout.trim()) as {
      kind?: string;
      data?: {
        format?: string;
        outputPath?: string | null;
        document?: { kind?: string };
      };
    };
    expect(env.kind).toBe('report');
    expect(env.data?.format).toBe('json');
    expect(env.data?.outputPath).toBe(out);
    expect(env.data?.document?.kind).toBe('i18nprune.projectReport');
    const disk = JSON.parse(fs.readFileSync(out, 'utf8')) as { kind?: string };
    expect(disk.kind).toBe('i18nprune.projectReport');
  });

  it('report --json when --out already exists uses keep-both path (no interactive prompt)', () => {
    const dir = makeTempDir('i18nprune-report-json-collision-');
    const out = path.join(dir, 'out.json');
    fs.writeFileSync(out, '{"kind":"stub"}', 'utf8');
    const stdout = execFileSync(process.execPath, [cliJs, '--json', 'report', '--format', 'json', '--out', out], {
      cwd: fixture,
      encoding: 'utf8',
      env: cliSpawnEnv(),
    });
    const env = JSON.parse(stdout.trim()) as {
      ok?: boolean;
      data?: { outputPath?: string | null };
    };
    expect(env.ok).toBe(true);
    const wrote = env.data?.outputPath;
    expect(wrote).toBeTruthy();
    expect(wrote).not.toBe(out);
    expect(wrote).toMatch(/out-[0-9a-f]{8}\.json$/);
    expect(fs.existsSync(wrote!)).toBe(true);
  });

  it('--from validates schema and can emit text from a prior JSON', () => {
    const dir = makeTempDir('i18nprune-report-');
    const jsonPath = path.join(dir, 'base.json');
    const txtPath = path.join(dir, 'out.txt');
    runCli(['report', '--format', 'json', '--out', jsonPath]);
    runCli(['report', '--from', jsonPath, '--format', 'text', '--out', txtPath]);
    const txt = fs.readFileSync(txtPath, 'utf8');
    expect(txt).toMatch(/i18nprune project report/);
    expect(txt).toMatch(/missing keys:/);
  });

  it(
    'html report is a single self-contained SPA with injected payload',
    () => {
      ensureReportHtmlBundle();
      const dir = makeTempDir('i18nprune-report-html-');
      const out = path.join(dir, 'report.html');
      runCli(['report', '--format', 'html', '--out', out]);
      const html = fs.readFileSync(out, 'utf8');
      expect(html).toMatch(/id="root"/);
      const m = html.match(/id="i18nprune-inline-payload"[^>]*>([\s\S]*?)<\/script>/);
      expect(m?.[1]?.trim()).toBeTruthy();
      const inner = m?.[1]?.trim();
      expect(inner).toBeTruthy();
      expect(inner).not.toBe('__I18NPRUNE_REPORT__');
      expect(() => JSON.parse(inner!)).not.toThrow();
      expect(html.split('__I18NPRUNE_REPORT__').length).toBeGreaterThanOrEqual(2);
      expect(html).toMatch(/i18nprune-inline-payload/);
    },
    15_000,
  );

  it('fails on --from with wrong kind', () => {
    const dir = makeTempDir('i18nprune-report-');
    const bad = path.join(dir, 'bad.json');
    fs.writeFileSync(bad, JSON.stringify({ kind: 'other' }), 'utf8');
    expect(() => runCli(['report', '--from', bad, '--format', 'text', '--out', path.join(dir, 't.txt')])).toThrow();
  });
});
