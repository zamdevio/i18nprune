import { beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixturesRoot = path.join(root, 'tests/fixtures');

const CONFIG_NAMES = ['i18nprune.config.mjs', 'i18nprune.config.ts', 'i18nprune.config.js'] as const;

const SKIP_DIR_NAMES = new Set(['__snapshots__', 'reports', 'node_modules']);

/** Fixtures that intentionally return ok:false or non-zero exit for some commands. */
const INTENTIONALLY_BROKEN = new Set(['layout-structure-missing', 'missing-cli']);

/** Skip generate dry-run — broken config or no non-source locale to target. */
const SKIP_GENERATE_DRY_RUN = new Set(['layout-structure-missing', 'missing-cli']);

function hasFixtureConfig(dir: string): boolean {
  return CONFIG_NAMES.some((name) => fs.existsSync(path.join(dir, name)));
}

/** Discover fixture app roots (directories with an i18nprune config). */
export function discoverFixtureRoots(baseDir: string): string[] {
  const roots: string[] = [];

  function walk(dir: string): void {
    if (hasFixtureConfig(dir)) {
      roots.push(dir);
      return;
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (!ent.isDirectory() || SKIP_DIR_NAMES.has(ent.name) || ent.name.startsWith('.')) {
        continue;
      }
      walk(path.join(dir, ent.name));
    }
  }

  walk(baseDir);
  return roots.sort((a, b) => a.localeCompare(b));
}

export const FIXTURE_APP_ROOTS = discoverFixtureRoots(fixturesRoot);

function fixtureLabel(cwd: string): string {
  return path.relative(fixturesRoot, cwd) || path.basename(cwd);
}

function runCliAllowNonZero(args: string[], cwd: string): { stdout: string; status: number | null } {
  const r = spawnSync(process.execPath, [cliJs, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  if (r.error) throw r.error;
  return { stdout: r.stdout ?? '', status: r.status };
}

function parseEnvelope(out: string): {
  ok: boolean;
  kind: string;
  data: Record<string, unknown>;
  issues: { code?: string }[];
  meta: { apiVersion?: string };
} {
  return JSON.parse(out.trim()) as {
    ok: boolean;
    kind: string;
    data: Record<string, unknown>;
    issues: { code?: string }[];
    meta: { apiVersion?: string };
  };
}

describe('CLI fixture apps smoke', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliJs)) {
      throw new Error('Missing dist/cli.js — run `pnpm cli:build` before `pnpm test`.');
    }
    expect(FIXTURE_APP_ROOTS.length).toBeGreaterThan(0);
  });

  for (const cwd of FIXTURE_APP_ROOTS) {
    const label = fixtureLabel(cwd);
    const broken = INTENTIONALLY_BROKEN.has(label);

    describe(label, () => {
      it('config --json returns parseable config envelope', () => {
        const { stdout } = runCliAllowNonZero(['config', '--json'], cwd);
        const j = parseEnvelope(stdout);
        expect(j.kind).toBe('config');
        expect(j.meta.apiVersion).toBe('1');
        expect((j.data as { kind?: string }).kind).toBe('i18nprune.config');
        if (!broken) expect(j.ok).toBe(true);
      });

      it('doctor --json returns parseable doctor envelope', () => {
        const { stdout } = runCliAllowNonZero(['doctor', '--json'], cwd);
        const j = parseEnvelope(stdout);
        expect(j.kind).toBe('doctor');
        expect(j.meta.apiVersion).toBe('1');
        expect(Array.isArray((j.data as { findings?: unknown[] }).findings)).toBe(true);
        if (!broken) expect(j.ok).toBe(true);
      });

      it('validate --json returns parseable validate envelope', () => {
        const { stdout } = runCliAllowNonZero(['validate', '--json'], cwd);
        const j = parseEnvelope(stdout);
        expect(j.kind).toBe('validate');
        expect(j.meta.apiVersion).toBe('1');
        expect(Array.isArray(j.issues)).toBe(true);
        expect(j.data).toBeDefined();
      });

      if (!SKIP_GENERATE_DRY_RUN.has(label)) {
        it('generate --json --dry-run returns parseable generate envelope', () => {
          const { stdout, status } = runCliAllowNonZero(
            ['generate', '--json', '--dry-run', '--target', 'fr'],
            cwd,
          );
          const j = parseEnvelope(stdout);
          expect(j.kind).toBe('generate');
          expect(j.meta.apiVersion).toBe('1');
          expect((j.data as { dryRun?: boolean }).dryRun).toBe(true);
          if (!broken) {
            expect(j.ok).toBe(true);
            expect(status).toBe(0);
          }
        });
      }
    });
  }
});
