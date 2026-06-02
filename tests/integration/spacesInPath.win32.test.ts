import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliSpawnEnv } from '../helpers/cliEnv.js';

const isWin32 = process.platform === 'win32';
const describeWin32 = isWin32 ? describe : describe.skip;

const repoRoot = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(repoRoot, 'dist/cli.js');
const sourceFixture = path.join(repoRoot, 'tests/fixtures/layout-flat-file');
const sharedFixture = path.join(repoRoot, 'tests/fixtures/shared');

const tempRoots: string[] = [];

afterEach(() => {
  for (const dir of tempRoots.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function copyFixtureInto(dirWithSpaces: string): string {
  const projectDir = path.join(dirWithSpaces, 'sample project');
  fs.cpSync(sourceFixture, projectDir, { recursive: true });
  // layout-flat-file config imports ../shared/fixtureTranslate.mjs (sibling of project dir)
  fs.cpSync(sharedFixture, path.join(dirWithSpaces, 'shared'), { recursive: true });
  return projectDir;
}

function runCli(args: string[], cwd: string, extraEnv?: Record<string, string>): string {
  return execFileSync(process.execPath, [cliJs, ...args], {
    cwd,
    encoding: 'utf8',
    env: cliSpawnEnv(extraEnv),
  });
}

function parseEnvelope(out: string): { ok: boolean; kind: string } {
  return JSON.parse(out.trim()) as { ok: boolean; kind: string };
}

/**
 * XP-7: Windows CI guard for spaces in project root and I18NPRUNE_HOME paths.
 * Skipped on linux/macOS matrix rows (no-op pass).
 */
describeWin32('CLI spaces in path (Windows)', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliJs)) {
      throw new Error('Missing dist/cli.js — run `pnpm cli:build` before `pnpm test`.');
    }
  });

  it('validate --json succeeds when project root and cache home contain spaces', () => {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune space-'));
    tempRoots.push(parent);
    const projectDir = copyFixtureInto(parent);
    const homeDir = path.join(parent, 'cli home');
    fs.mkdirSync(homeDir, { recursive: true });

    const env = { I18NPRUNE_HOME: homeDir };
    const first = parseEnvelope(runCli(['validate', '--json'], projectDir, env));
    expect(first.kind).toBe('validate');

    const second = parseEnvelope(runCli(['validate', '--json'], projectDir, env));
    expect(second.kind).toBe('validate');

    expect(fs.existsSync(path.join(homeDir, 'cache', 'meta.json'))).toBe(true);
  });
});
