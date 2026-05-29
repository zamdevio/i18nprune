import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const stacksRoot = path.join(root, 'tests/fixtures/stacks');

const STACK_FIXTURES = ['vue-sfc', 'react-tsx', 'next-app-dir'] as const;

function runCli(args: string[], cwd: string): string {
  return execFileSync(process.execPath, [cliJs, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
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

describe('CLI stack fixtures', () => {
  beforeAll(() => {
    if (!fs.existsSync(cliJs)) {
      throw new Error('Missing dist/cli.js — run `pnpm cli:build` before `pnpm test`.');
    }
  });

  for (const stack of STACK_FIXTURES) {
    describe(stack, () => {
      const cwd = path.join(stacksRoot, stack);

      it('config --json returns ok config envelope', () => {
        const out = runCli(['config', '--json'], cwd);
        const j = parseEnvelope(out);
        expect(j.ok).toBe(true);
        expect(j.kind).toBe('config');
        expect(j.meta.apiVersion).toBe('1');
        expect((j.data as { kind?: string }).kind).toBe('i18nprune.config');
      });

      it('doctor --json returns ok doctor envelope', () => {
        const out = runCli(['doctor', '--json'], cwd);
        const j = parseEnvelope(out);
        expect(j.ok).toBe(true);
        expect(j.kind).toBe('doctor');
        expect(j.meta.apiVersion).toBe('1');
        expect(Array.isArray((j.data as { findings?: unknown[] }).findings)).toBe(true);
      });

      it('validate --json returns parseable validate envelope', () => {
        const out = runCli(['validate', '--json'], cwd);
        const j = parseEnvelope(out);
        expect(j.kind).toBe('validate');
        expect(j.meta.apiVersion).toBe('1');
        expect(Array.isArray(j.issues)).toBe(true);
        expect(j.data).toBeDefined();
      });
    });
  }
});
