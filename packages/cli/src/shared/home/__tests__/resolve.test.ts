import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ENV_I18NPRUNE_HOME } from '@/constants/env.js';
import {
  defaultI18nPruneHomeDir,
  isI18nPruneHomeOverridden,
  resolveI18nPruneCacheRootDir,
  resolveI18nPruneHomeDir,
  resolveVersionStateFilePath,
} from '../resolve.js';

describe('i18nprune home resolution', () => {
  const prevHome = process.env[ENV_I18NPRUNE_HOME];

  afterEach(() => {
    if (prevHome === undefined) delete process.env[ENV_I18NPRUNE_HOME];
    else process.env[ENV_I18NPRUNE_HOME] = prevHome;
  });

  it('defaults to homedir/.i18nprune', () => {
    delete process.env[ENV_I18NPRUNE_HOME];
    expect(resolveI18nPruneHomeDir()).toBe(defaultI18nPruneHomeDir());
    expect(isI18nPruneHomeOverridden()).toBe(false);
  });

  it('honors I18NPRUNE_HOME for cache and version paths', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-home-'));
    process.env[ENV_I18NPRUNE_HOME] = root;
    expect(isI18nPruneHomeOverridden()).toBe(true);
    expect(resolveI18nPruneHomeDir()).toBe(path.resolve(root));
    expect(resolveI18nPruneCacheRootDir()).toBe(path.join(path.resolve(root), 'cache'));
    expect(resolveVersionStateFilePath()).toBe(path.join(path.resolve(root), 'state', 'version.json'));
    fs.rmSync(root, { recursive: true, force: true });
  });
});
