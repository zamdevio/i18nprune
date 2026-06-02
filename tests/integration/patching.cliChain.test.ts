import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { cliSpawnEnv } from '../helpers/cliEnv.js';

const patchingFixtureRoot = path.join(
  fileURLToPath(new URL('.', import.meta.url)),
  '../fixtures/patching',
);

/**
 * Spawns **`dist/cli.js`** (requires **`pnpm build`** / CI build). **`generate`** hits the public
 * MyMemory HTTP API — use **`{ retry, timeout }`** for transient quota; air‑gapped CI may need to
 * exclude this file from the suite if the job cannot reach the network.
 */
const repoRoot = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(repoRoot, 'dist/cli.js');
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function mkTemp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-patch-cli-'));
  tempDirs.push(dir);
  return dir;
}

/** Combined stdout + stderr (`logger.info` uses **`console.log`** → stdout). */
function runCliCapture(args: string[], cwd: string): { status: number | null; out: string } {
  const r = spawnSync(process.execPath, [cliJs, ...args], {
    cwd,
    encoding: 'utf8',
    env: cliSpawnEnv({ CI: '1' }),
  });
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

function readLocaleRegistryCodes(loaderPath: string): string[] {
  const gen = fs.readFileSync(loaderPath, 'utf8');
  const m = gen.match(/const LOCALE_REGISTRY = (\[[\s\S]*?\])\s+as const;/);
  expect(m).toBeTruthy();
  const rows = JSON.parse(m![1]!) as Array<{ code: string }>;
  return rows.map((r) => r.code);
}

/** Copy committed `tests/fixtures/patching/` tree (intentional config/registry drift). */
function copyPatchingFixture(dir: string): void {
  fs.cpSync(patchingFixtureRoot, dir, { recursive: true });
}

describe('patching CLI chain (patch --fix → --patch sync → --patch generate)', () => {
  it(
    'runs patch --fix, then --patch sync, then --patch generate with MyMemory (public API)',
    { retry: 2, timeout: 120_000 },
    () => {
      const dir = mkTemp();
      copyPatchingFixture(dir);

      const fix = runCliCapture(['patch', '--fix', '--yes'], dir);
      expect(fix.status).toBe(0);

      const configPath = path.join(dir, 'src', 'i18n', 'config.json');
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { locales: Array<{ code: string }> };
      const codes = cfg.locales.map((r) => r.code).sort();
      expect(codes).toEqual(['ar', 'en', 'fr'].sort());

      const loaderPath = path.join(dir, 'src', 'i18n', 'loaders.generated.ts');
      expect(readLocaleRegistryCodes(loaderPath).sort()).toEqual(codes);

      const enPath = path.join(dir, 'locales', 'en.json');
      const en = JSON.parse(fs.readFileSync(enPath, 'utf8')) as Record<string, string>;
      // Schema-first sync: only keys referenced in src (k1, k3) propagate — not unused k2.
      en.k1 = 'synced-value';
      fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`, 'utf8');

      const sync = runCliCapture(['--patch', 'sync', '--yes', '--target', 'fr'], dir);
      expect(sync.status).toBe(0);
      expect(sync.out).toMatch(/patching \(sync\)/);

      const frAfterSync = JSON.parse(fs.readFileSync(path.join(dir, 'locales', 'fr.json'), 'utf8')) as Record<
        string,
        unknown
      >;
      expect(frAfterSync.k1).toBe('synced-value');

      const gen = spawnSync(
        process.execPath,
        [cliJs, '--patch', 'generate', '--yes', '--force', '--target', 'fr'],
        {
        cwd: dir,
        encoding: 'utf8',
        env: cliSpawnEnv({ CI: '1' }),
      });
      expect(gen.status).toBe(0);
      const genOut = `${gen.stdout ?? ''}${gen.stderr ?? ''}`;
      expect(genOut).toMatch(/patching \(generate\)/);

      const frAfterGen = JSON.parse(fs.readFileSync(path.join(dir, 'locales', 'fr.json'), 'utf8')) as Record<
        string,
        unknown
      >;
      expect(frAfterGen.k3).toBeDefined();
      expect(typeof frAfterGen.k3 === 'string' || (frAfterGen.k3 && typeof frAfterGen.k3 === 'object')).toBe(true);
    },
  );
});
