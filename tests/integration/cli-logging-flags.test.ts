import { beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliSpawnEnv } from '../helpers/cliEnv.js';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/sample-i18n');

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

function runValidateStderr(extraArgs: string[], env: NodeJS.ProcessEnv): string {
  const r = spawnSync(process.execPath, [cliJs, 'validate', '-q', ...extraArgs], {
    cwd: fixture,
    encoding: 'utf8',
    env,
    maxBuffer: 10 * 1024 * 1024,
  });
  expect(r.status, r.stderr ?? r.stdout ?? '').toBe(0);
  return stripAnsi(r.stderr ?? '');
}

describe('CLI logging presentation flags', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliJs)) {
      throw new Error('Missing dist/cli.js — run `pnpm cli:build` before `pnpm test`.');
    }
  });

  it('NO_COLOR=1 and --no-color produce identical plain stderr', () => {
    const base = cliSpawnEnv({ I18NPRUNE_NO_UPDATE_CHECK: '1' });
    const fromEnv = runValidateStderr([], { ...base, NO_COLOR: '1' });
    const fromFlag = runValidateStderr(['--no-color'], base);
    expect(fromFlag).toBe(fromEnv);
    expect(fromEnv).not.toMatch(/\x1b\[/);
  });

  it('--no-log-prefix removes [i18nprune] from warn lines', () => {
    const stderr = runValidateStderr(['--no-log-prefix', '--no-color'], cliSpawnEnv());
    const warnLines = stderr.split('\n').filter((l) => l.includes('dynamic_key_sites'));
    expect(warnLines.length).toBeGreaterThan(0);
    for (const line of warnLines) {
      expect(line).not.toContain('[i18nprune]');
      expect(line).toMatch(/^\[warn\]/);
    }
  });

  it('--no-log-channel removes level tags', () => {
    const stderr = runValidateStderr(['--no-log-channel', '--no-color'], cliSpawnEnv());
    const warnLines = stderr.split('\n').filter((l) => l.includes('dynamic_key_sites'));
    expect(warnLines.length).toBeGreaterThan(0);
    for (const line of warnLines) {
      expect(line).toContain('[i18nprune]');
      expect(line).not.toMatch(/\[warn\]/);
    }
  });

  it('combines prefix and channel flags to grep-friendly warn lines', () => {
    const stderr = runValidateStderr(
      ['--no-log-prefix', '--no-log-channel', '--no-color'],
      cliSpawnEnv(),
    );
    const warnLines = stderr.split('\n').filter((l) => l.includes('dynamic_key_sites'));
    expect(warnLines.length).toBeGreaterThan(0);
    for (const line of warnLines) {
      expect(line).not.toContain('[i18nprune]');
      expect(line).not.toMatch(/\[warn\]/);
      expect(line).toContain('issue:');
    }
  });
});
