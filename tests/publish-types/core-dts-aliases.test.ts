import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixScript = path.join(repoRoot, 'scripts', 'dts', 'fix-core-dts.mjs');

describe('publish core.d.ts namespace aliases', () => {
  it('detects and sanitizes invalid typeof aliases; dist/core.d.ts is clean after cli:build', () => {
    execFileSync(process.execPath, [fixScript, '--test'], {
      cwd: repoRoot,
      stdio: 'pipe',
      env: process.env,
    });
  });
});
