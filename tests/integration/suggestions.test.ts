import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliSpawnEnv } from '../helpers/cliEnv.js';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/suggest-unused');

function runCli(args: string[]): string {
  const r = spawnSync(process.execPath, [cliJs, ...args], {
    cwd: fixture,
    encoding: 'utf8',
    env: cliSpawnEnv(),
  });
  return `${r.stdout ?? ''}${r.stderr ?? ''}`;
}

describe('locale suggestion tips (suggest-unused fixture)', () => {
  it('validate stderr includes source-unused tip with segmented paths', () => {
    const out = runCli(['validate']);
    expect(out).toMatch(/\[tip\]/);
    expect(out).toMatch(/unused key\(s\)/);
    expect(out).toMatch(/en\/stale\.json/);
    expect(out).toMatch(/i18nprune cleanup --dry-run/);
  });

  it('generate stderr includes source-unused and read-only target-extra tips', () => {
    const out = runCli(['generate', '--target', 'fr', '--dry-run']);
    expect(out).toMatch(/Source locale \(en\) has \d+ unused key\(s\)/);
    expect(out).toMatch(/en\/stale\.json/);
    expect(out).toMatch(/Target locale \(fr\) has \d+ extra key\(s\)/);
    expect(out).toMatch(/fr\/stale\.json/);
    expect(out).toMatch(/i18nprune cleanup --target fr --dry-run/);
  });

  it('validate --json exposes stable suggestion ids', () => {
    const out = runCli(['validate', '--json']);
    const envelope = JSON.parse(out.trim()) as {
      data: { suggestions?: { id: string }[] };
    };
    const ids = (envelope.data.suggestions ?? []).map((s) => s.id);
    expect(ids).toContain('suggest.cleanup.source_unused');
    expect(ids).toContain('suggest.cleanup.target_extra');
  });
});
