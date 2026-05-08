import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  listDiscoveredConfigFiles,
  resetConfigPathResolution,
  setConfigPath,
} from '@/shared/config/index.js';

describe('config paths', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-resolve-'));
    resetConfigPathResolution();
    setConfigPath(undefined);
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    resetConfigPathResolution();
    setConfigPath(undefined);
  });

  it('lists discovered ts and js config files', () => {
    fs.writeFileSync(path.join(dir, 'i18nprune.config.ts'), 'export default {}', 'utf8');
    fs.writeFileSync(path.join(dir, 'i18nprune.config.mjs'), 'export default {}', 'utf8');
    const found = listDiscoveredConfigFiles(dir);
    expect(found.length).toBe(2);
    expect(found.some((p) => p.endsWith('i18nprune.config.ts'))).toBe(true);
    expect(found.some((p) => p.endsWith('i18nprune.config.mjs'))).toBe(true);
  });
});
