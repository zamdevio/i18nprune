import { beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeReviewHumanStderr,
  normalizeReviewJsonEnvelope,
} from './normalizeReviewParity.ts';
import { paritySpawnEnv } from './paritySpawnEnv.ts';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/sample-i18n');
const snapshotDir = path.join(fixture, '__snapshots__');
const snapshotJson = path.join(snapshotDir, 'review.parity.json');
const snapshotStderr = path.join(snapshotDir, 'review.parity.stderr.txt');

describe('review parity (sample-i18n)', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliJs)) {
      throw new Error('Missing dist/cli.js — run `pnpm cli:build` before `pnpm test`.');
    }
  });

  it('matches normalized JSON envelope snapshot', () => {
    const fixtureAbs = path.resolve(fixture);
    const r = spawnSync(process.execPath, [cliJs, 'review', '--json', '--target', 'ar'], {
      cwd: fixture,
      encoding: 'utf8',
      env: paritySpawnEnv(),
      maxBuffer: 50 * 1024 * 1024,
    });
    expect(r.status, r.stderr ?? '').toBe(0);
    expect(r.stderr ?? '', 'review --json should not write to stderr').toBe('');
    const normalized = normalizeReviewJsonEnvelope(r.stdout ?? '', fixtureAbs);
    expect(normalized).toBe(fs.readFileSync(snapshotJson, 'utf8'));
  });

  it('matches normalized human [i18nprune] stderr snapshot', () => {
    const fixtureAbs = path.resolve(fixture);
    const r = spawnSync(process.execPath, [cliJs, 'review', '--target', 'ar'], {
      cwd: fixture,
      encoding: 'utf8',
      env: paritySpawnEnv(),
      maxBuffer: 50 * 1024 * 1024,
    });
    expect(r.status, r.stderr ?? '').toBe(0);
    const normalized = normalizeReviewHumanStderr(r.stderr ?? '', fixtureAbs);
    expect(normalized).toBe(fs.readFileSync(snapshotStderr, 'utf8'));
  });
});
