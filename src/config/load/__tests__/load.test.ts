import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '@/config/load/index.js';
import { ConfigValidationError } from '@/config/schema.js';
import { resetConfigPathResolution, setConfigPath } from '@/config/resolve/scan.js';

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

  it('returns defaults when no config file exists', () => {
    const c = loadConfig();
    expect(c.source).toBe('locales/en.json');
    expect(c.functions).toEqual(['t']);
  });

  it('throws ConfigValidationError for unsupported extension via --config', () => {
    const p = path.join(tmp, 'bad.json');
    fs.writeFileSync(p, '{}', 'utf8');
    setConfigPath('bad.json');
    expect(() => loadConfig()).toThrow(ConfigValidationError);
  });
});
