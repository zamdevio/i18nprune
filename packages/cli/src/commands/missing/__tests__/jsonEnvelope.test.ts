import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { clearContextCache, resolveContext } from '@/shared/context/index.js';
import { runMissingJsonEnvelope } from '../jsonEnvelope.js';

const tempDirs: string[] = [];

afterEach(() => {
  clearContextCache();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function createMissingFixture(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-missing-json-'));
  tempDirs.push(dir);
  fs.mkdirSync(path.join(dir, 'locales'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'i18nprune.config.ts'),
    `export default { source: 'locales/en.json', localesDir: 'locales', src: 'src', functions: ['t'] };\n`,
  );
  fs.writeFileSync(path.join(dir, 'locales/en.json'), '{}\n');
  fs.writeFileSync(path.join(dir, 'src/main.ts'), `export const value = t('fixture.missing.alpha');\n`);
  return dir;
}

describe('runMissingJsonEnvelope', () => {
  it('writes planned paths when JSON mode is explicitly allowed to apply writes', async () => {
    const dir = createMissingFixture();
    const ctx = await resolveContext(dir);

    const result = runMissingJsonEnvelope(ctx, {}, undefined, { applyWrites: true });

    expect(result.envelope.ok).toBe(true);
    const source = JSON.parse(fs.readFileSync(path.join(dir, 'locales/en.json'), 'utf8')) as {
      fixture?: { missing?: { alpha?: unknown } };
    };
    expect(source.fixture?.missing?.alpha).toBe('__I18NPRUNE_MISSING__');
  });

  it('keeps plain JSON mode read-only when applyWrites is not set', async () => {
    const dir = createMissingFixture();
    const ctx = await resolveContext(dir);

    const result = runMissingJsonEnvelope(ctx, {});

    expect(result.envelope.ok).toBe(true);
    const source = JSON.parse(fs.readFileSync(path.join(dir, 'locales/en.json'), 'utf8')) as Record<string, unknown>;
    expect(source).toEqual({});
  });
});
