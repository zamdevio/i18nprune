import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliSpawnEnv } from '../helpers/cliEnv.js';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixturesRoot = path.join(root, 'tests/fixtures');

function runCli(args: string[], cwd: string): string {
  return execFileSync(process.execPath, [cliJs, ...args], {
    cwd,
    encoding: 'utf8',
    env: cliSpawnEnv(),
  });
}

function parseEnvelope(out: string): {
  ok: boolean;
  kind: string;
  data: Record<string, unknown>;
  issues: { code?: string }[];
} {
  return JSON.parse(out.trim()) as {
    ok: boolean;
    kind: string;
    data: Record<string, unknown>;
    issues: { code?: string }[];
  };
}

describe('CLI layout fixtures', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliJs)) {
      throw new Error('Missing dist/cli.js — run `pnpm cli:build` before `pnpm test`.');
    }
  });

  it('layout-flat-file: locales list discovers en and fr at bundle root', () => {
    const cwd = path.join(fixturesRoot, 'layout-flat-file');
    const out = runCli(['locales', 'list', '--json'], cwd);
    const j = parseEnvelope(out);
    const rows = j.data.rows as { code: string; localePath: string }[];
    const codes = new Set(rows.map((r) => r.code));
    expect(codes.has('en')).toBe(true);
    expect(codes.has('fr')).toBe(true);
    expect(rows.some((r) => r.localePath.endsWith('/en.json'))).toBe(true);
    expect(rows.some((r) => r.localePath.endsWith('/fr.json'))).toBe(true);
  });

  it('layout-locale-per-dir: locales list discovers en and fr segment rows', () => {
    const cwd = path.join(fixturesRoot, 'layout-locale-per-dir');
    const out = runCli(['locales', 'list', '--json'], cwd);
    const j = parseEnvelope(out);
    expect(j.kind).toBe('locales-list');
    const rows = j.data.rows as { code: string; localePath: string }[];
    const codes = new Set(rows.map((r) => r.code));
    expect(codes.has('en')).toBe(true);
    expect(codes.has('fr')).toBe(true);
    expect(rows.some((r) => r.localePath.includes('en/'))).toBe(true);
  });

  it('layout-feature-bundle: locales list uses basename locale across features', () => {
    const cwd = path.join(fixturesRoot, 'layout-feature-bundle');
    const out = runCli(['locales', 'list', '--json'], cwd);
    const j = parseEnvelope(out);
    const rows = j.data.rows as { code: string; localePath: string }[];
    const codes = new Set(rows.map((r) => r.code));
    expect(codes.has('en')).toBe(true);
    expect(codes.has('fr')).toBe(true);
    expect(rows.some((r) => r.localePath.includes('auth/'))).toBe(true);
  });

  it('layout-structure-missing: validate fails readiness for missing structure', () => {
    const cwd = path.join(fixturesRoot, 'layout-structure-missing');
    const r = spawnSync(process.execPath, [cliJs, 'validate', '--json'], {
      cwd,
      encoding: 'utf8',
      env: cliSpawnEnv(),
    });
    expect(r.status).toBe(1);
    const j = parseEnvelope(r.stdout ?? '');
    expect(j.ok).toBe(false);
    expect(j.issues.some((i) => i.code === 'i18nprune.project.locales_structure_required')).toBe(true);
  });
});
