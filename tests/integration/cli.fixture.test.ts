import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/sample-i18n-app');

function runCli(args: string[]): string {
  return execFileSync(process.execPath, [cliJs, ...args], {
    cwd: fixture,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
}

describe('CLI against sample-i18n-app fixture', () => {
  it('validate reports literal keys vs source JSON (fixture may include missing keys)', () => {
    const out = runCli(['validate']);
    expect(out).toMatch(/validate · (ok|failed) ·/);
    expect(out).toMatch(/missing( from source JSON)?:/i);
  });

  it('validate --json includes dynamic block', () => {
    const out = runCli(['validate', '--json']);
    const j = JSON.parse(out.trim()) as {
      dynamic?: { count: number; sites: unknown[] };
      missing?: string[];
    };
    expect(j.dynamic).toBeDefined();
    expect(typeof j.dynamic?.count).toBe('number');
    expect(Array.isArray(j.dynamic?.sites)).toBe(true);
    expect(Array.isArray(j.missing)).toBe(true);
  });

  it('config --json returns kind i18nprune.config and path kinds', () => {
    const out = runCli(['--json', 'config']);
    const j = JSON.parse(out.trim()) as {
      kind?: string;
      resolvedPathKinds?: { sourceLocale?: string; localesDir?: string; srcRoot?: string };
    };
    expect(j.kind).toBe('i18nprune.config');
    expect(j.resolvedPathKinds?.sourceLocale).toBe('file');
    expect(j.resolvedPathKinds?.localesDir).toBe('directory');
    expect(j.resolvedPathKinds?.srcRoot).toBe('directory');
  });

  it('review --json returns localeReview', () => {
    const out = runCli(['--json', 'review']);
    const j = JSON.parse(out.trim()) as { kind?: string; locales?: Record<string, unknown> };
    expect(j.kind).toBe('localeReview');
    expect(j.locales).toBeDefined();
  });

  it('doctor --json returns kind doctor', () => {
    const out = runCli(['--json', 'doctor']);
    const j = JSON.parse(out.trim()) as { kind?: string; findings?: unknown[] };
    expect(j.kind).toBe('doctor');
    expect(Array.isArray(j.findings)).toBe(true);
  });

  it('sync --dry-run prints a human Sync summary footer', () => {
    const out = runCli(['sync', '--dry-run']);
    expect(out).toMatch(/Sync summary/);
    expect(out).toMatch(/Duration:\s+\d+ms/);
    expect(out).toMatch(/target file\(s\)/);
  });
});
