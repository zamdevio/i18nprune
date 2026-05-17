import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');

const MINIMAL = `export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
  },
  src: 'src',
  functions: ['t'],
};
`;

describe('CLI duplicate config files', () => {
  it('exits non-zero when multiple config files exist and CI=1', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-dup-'));
    try {
      fs.writeFileSync(path.join(dir, 'i18nprune.config.ts'), MINIMAL, 'utf8');
      fs.writeFileSync(path.join(dir, 'i18nprune.config.js'), MINIMAL, 'utf8');
      expect(() =>
        execFileSync(process.execPath, [cliJs, 'validate'], {
          cwd: dir,
          encoding: 'utf8',
          env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
        }),
      ).toThrow();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
