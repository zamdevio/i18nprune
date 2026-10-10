import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  listDiscoveredConfigFiles,
  resetConfigPathResolution,
  resolveConfigFilePathForRoot,
  setChosenImplicitPath,
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

  describe('resolveConfigFilePathForRoot', () => {
    it('ignores the process-global implicit memo (the serve multi-root leak)', () => {
      fs.writeFileSync(path.join(dir, 'i18nprune.config.ts'), 'export default {}', 'utf8');
      // Simulate single-root CLI startup pinning a *different* answer (e.g. from process cwd).
      setChosenImplicitPath(null);
      expect(resolveConfigFilePathForRoot(dir)).toBe(path.join(dir, 'i18nprune.config.ts'));
    });

    it('returns null for a root without a config, even if a global path is pinned', () => {
      setChosenImplicitPath('/somewhere/else/i18nprune.config.ts');
      expect(resolveConfigFilePathForRoot(dir)).toBeNull();
    });

    it('throws on ambiguous configs in the root', () => {
      fs.writeFileSync(path.join(dir, 'i18nprune.config.ts'), 'export default {}', 'utf8');
      fs.writeFileSync(path.join(dir, 'i18nprune.config.js'), 'export default {}', 'utf8');
      expect(() => resolveConfigFilePathForRoot(dir)).toThrow(/Multiple config files/);
    });

    it('honors an explicit --config override, relative to the root', () => {
      fs.writeFileSync(path.join(dir, 'custom.config.ts'), 'export default {}', 'utf8');
      setConfigPath('custom.config.ts');
      expect(resolveConfigFilePathForRoot(dir)).toBe(path.join(dir, 'custom.config.ts'));
    });
  });
});
