import { beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeMissingHumanStderr,
  normalizeMissingJsonEnvelope,
} from './normalizeMissingParity.ts';
import { paritySpawnEnv } from './paritySpawnEnv.ts';
import { readParitySnapshotText } from './readParitySnapshot.ts';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/sample-i18n');
const snapshotDir = path.join(fixture, '__snapshots__');
const snapshotJson = path.join(snapshotDir, 'missing.parity.json');
const snapshotStderr = path.join(snapshotDir, 'missing.parity.stderr.txt');

describe('missing parity (sample-i18n)', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliJs)) {
      throw new Error('Missing dist/cli.js — run `pnpm cli:build` before `pnpm test`.');
    }
  });

  it('matches normalized JSON envelope snapshot', () => {
    const fixtureAbs = path.resolve(fixture);
    const r = spawnSync(process.execPath, [cliJs, 'missing', '--json', '--dry-run'], {
      cwd: fixture,
      encoding: 'utf8',
      env: paritySpawnEnv(),
      maxBuffer: 50 * 1024 * 1024,
    });
    expect(r.status, r.stderr ?? '').toBe(0);
    expect(r.stderr ?? '', 'missing --json should not write to stderr').toBe('');
    const normalized = normalizeMissingJsonEnvelope(r.stdout ?? '', fixtureAbs);
    expect(normalized).toBe(readParitySnapshotText(snapshotJson));
  });

  it('matches normalized human [i18nprune] stderr snapshot', () => {
    const fixtureAbs = path.resolve(fixture);
    const r = spawnSync(process.execPath, [cliJs, 'missing', '--dry-run'], {
      cwd: fixture,
      encoding: 'utf8',
      env: paritySpawnEnv(),
      maxBuffer: 50 * 1024 * 1024,
    });
    expect(r.status, r.stderr ?? '').toBe(0);
    const normalized = normalizeMissingHumanStderr(r.stderr ?? '', fixtureAbs);
    expect(normalized).toBe(readParitySnapshotText(snapshotStderr));
  });

  it('warns and skips missing --target locale files without failing', () => {
    const r = spawnSync(process.execPath, [cliJs, 'missing', '--json', '--dry-run', '--target', 'aa'], {
      cwd: fixture,
      encoding: 'utf8',
      env: paritySpawnEnv(),
      maxBuffer: 50 * 1024 * 1024,
    });
    expect(r.status, r.stderr ?? '').toBe(0);
    const parsed = JSON.parse(r.stdout) as {
      data: { skippedTargets: Array<{ localeCode: string; targetPath: string; reason: string }> };
      issues: Array<{ code: string; severity: string }>;
    };
    expect(parsed.data.skippedTargets).toEqual([{ localeCode: 'aa', targetPath: 'locales/aa.json', reason: 'not_found' }]);
    expect(parsed.issues).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        code: 'i18nprune.locale.target_not_found',
      }),
    );
  });

  it('suggests existing locale targets for catalog-backed typos', () => {
    const r = spawnSync(process.execPath, [cliJs, 'missing', '--json', '--dry-run', '--target', 'arabic'], {
      cwd: fixture,
      encoding: 'utf8',
      env: paritySpawnEnv(),
      maxBuffer: 50 * 1024 * 1024,
    });
    expect(r.status, r.stderr ?? '').toBe(0);
    const parsed = JSON.parse(r.stdout) as {
      data: { skippedTargets: Array<{ localeCode: string; suggestions?: string[] }> };
      issues: Array<{ code: string; message: string }>;
    };
    expect(parsed.data.skippedTargets[0]).toEqual(
      expect.objectContaining({ localeCode: 'arabic', suggestions: ['ar'] }),
    );
    expect(parsed.issues).toContainEqual(
      expect.objectContaining({
        code: 'i18nprune.locale.target_not_found',
        message: expect.stringContaining('Did you mean: ar?'),
      }),
    );
  });

  it('resolves missing --target all inside core to existing non-source locale files', () => {
    const r = spawnSync(process.execPath, [cliJs, 'missing', '--json', '--dry-run', '--target', 'all'], {
      cwd: fixture,
      encoding: 'utf8',
      env: paritySpawnEnv(),
      maxBuffer: 50 * 1024 * 1024,
    });
    expect(r.status, r.stderr ?? '').toBe(0);
    const parsed = JSON.parse(r.stdout) as {
      data: { targets: Array<{ selectedLocaleCode?: string }>; skippedTargets: unknown[] };
    };
    expect(parsed.data.targets.map((target) => target.selectedLocaleCode).sort()).toEqual(['ar', 'fr', 'so']);
    expect(parsed.data.skippedTargets).toEqual([]);
  });
});
