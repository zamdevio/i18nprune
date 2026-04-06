import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureConfigPathResolved } from '@/config/resolve/ensure.js';
import { resetConfigPathResolution, setConfigPath } from '@/config/resolve/scan.js';
import { setArgvJsonFlag } from '@/core/context/globals.js';
import { resetRunOptions } from '@/core/runtime/options.js';

describe('ensureConfigPathResolved', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-ensure-'));
    resetConfigPathResolution();
    setConfigPath(undefined);
    resetRunOptions();
    setArgvJsonFlag(true);
    process.env.CI = '1';
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`EXIT:${String(code)}`);
    });
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    resetConfigPathResolution();
    setConfigPath(undefined);
    resetRunOptions();
    delete process.env.CI;
    setArgvJsonFlag(false);
    vi.restoreAllMocks();
  });

  it('calls process.exit(1) when multiple configs exist in non-interactive mode', async () => {
    fs.writeFileSync(path.join(dir, 'i18nprune.config.ts'), 'export default {}', 'utf8');
    fs.writeFileSync(path.join(dir, 'i18nprune.config.js'), 'export default {}', 'utf8');
    await expect(ensureConfigPathResolved(dir)).rejects.toThrow(/EXIT:1/);
  });
});
