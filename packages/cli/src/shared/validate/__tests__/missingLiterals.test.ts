import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { clearContextCache, resolveContext } from '@/shared/context/index.js';
import { resetConfigPathResolution, setConfigPath } from '@/shared/config/index.js';
import { computeMissingLiteralKeys } from '@/shared/validate/index.js';

describe('computeMissingLiteralKeys', () => {
  let dir: string;
  const prev = process.cwd();

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-litkeys-'));
    process.chdir(dir);
    clearContextCache();
    setConfigPath(undefined);
    resetConfigPathResolution();
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'locales'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'i18nprune.config.mjs'),
      `export default {
        locales: {
          source: 'en',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        policies: { preserve: {}, parity: {} },
      };`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(dir, 'locales/en.json'),
      JSON.stringify({ existing: 'ok' }),
      'utf8',
    );
    fs.writeFileSync(
      path.join(dir, 'src/app.ts'),
      `import { t } from './x';\nexport const x = t('a.b') + t('a.c');\n`,
      'utf8',
    );
  });

  afterEach(() => {
    process.chdir(prev);
    clearContextCache();
    setConfigPath(undefined);
    resetConfigPathResolution();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns dotted paths present in code but not in locale JSON', async () => {
    const ctx = await resolveContext(dir);
    const raw = JSON.parse(fs.readFileSync(path.join(dir, 'locales/en.json'), 'utf8'));
    const missing = computeMissingLiteralKeys(ctx, raw);
    expect(missing).toContain('a.b');
    expect(missing).toContain('a.c');
    expect(missing).not.toContain('existing');
  });

  it('returns empty when all keys exist', async () => {
    fs.writeFileSync(
      path.join(dir, 'locales/en.json'),
      JSON.stringify({ existing: 'ok', a: { b: '1', c: '2' } }),
      'utf8',
    );
    const ctx = await resolveContext(dir);
    const raw = JSON.parse(fs.readFileSync(path.join(dir, 'locales/en.json'), 'utf8'));
    const missing = computeMissingLiteralKeys(ctx, raw);
    expect(missing).toEqual([]);
  });

  /**
   * Merged-source `const NS` maps collapse duplicate identifiers across files; per-file scan keeps
   * each file's const map so `` `${NS}.x` `` resolves with the correct NS.
   */
  it('does not report false missing when two files reuse the same const name (NS)', async () => {
    fs.unlinkSync(path.join(dir, 'src', 'app.ts'));
    fs.writeFileSync(
      path.join(dir, 'locales/en.json'),
      JSON.stringify({
        pages: {
          dashboard: {
            admin: { departments: { title: 'T', description: 'D' } },
            shortcuts: { maintenance: 'M' },
          },
        },
      }),
      'utf8',
    );
    fs.writeFileSync(
      path.join(dir, 'src', 'admin.tsx'),
      `const NS = 'pages.dashboard.admin';\nimport { t } from 'x';\nexport const a = t(\`\${NS}.departments.title\`);\n`,
      'utf8',
    );
    fs.writeFileSync(
      path.join(dir, 'src', 'zzz-shortcuts.tsx'),
      `const NS = 'pages.dashboard.shortcuts';\nimport { t } from 'x';\nexport const z = t(\`\${NS}.maintenance\`);\n`,
      'utf8',
    );
    const ctx = await resolveContext(dir);
    const raw = JSON.parse(fs.readFileSync(path.join(dir, 'locales/en.json'), 'utf8'));
    const missing = computeMissingLiteralKeys(ctx, raw);
    expect(missing).toEqual([]);
  });
});
