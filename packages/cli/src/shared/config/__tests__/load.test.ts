import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ConfigValidationError } from '@i18nprune/core/config';
import { loadConfig, resetConfigPathResolution, setConfigPath } from '@/shared/config/index.js';

describe('loadConfig', () => {
  let tmp: string;
  let prevCwd: string;

  beforeEach(() => {
    prevCwd = process.cwd();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-load-'));
    process.chdir(tmp);
    resetConfigPathResolution();
    setConfigPath(undefined);
  });

  afterEach(() => {
    process.chdir(prevCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
    resetConfigPathResolution();
    setConfigPath(undefined);
  });

  it('returns defaults when no config file exists', async () => {
    const c = await loadConfig();
    expect(c.locales.source).toBe('en');
    expect(c.functions).toEqual(['t']);
  });

  it('throws ConfigValidationError for unsupported extension via --config', async () => {
    const p = path.join(tmp, 'bad.json');
    fs.writeFileSync(p, '{}', 'utf8');
    setConfigPath('bad.json');
    await expect(loadConfig()).rejects.toThrow(ConfigValidationError);
  });
});
