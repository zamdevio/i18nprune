import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ENV_I18NPRUNE_HOME } from '@/constants/env.js';
import { defaultI18nPruneHomeDir } from '@/shared/home/resolve.js';
import { getUpdateStateFilePath } from '../paths.js';

describe('getUpdateStateFilePath', () => {
  const prevHome = process.env[ENV_I18NPRUNE_HOME];

  afterEach(() => {
    if (prevHome === undefined) delete process.env[ENV_I18NPRUNE_HOME];
    else process.env[ENV_I18NPRUNE_HOME] = prevHome;
  });

  it('uses <home>/state/version.json under the default home', () => {
    delete process.env[ENV_I18NPRUNE_HOME];
    expect(getUpdateStateFilePath()).toBe(
      path.join(defaultI18nPruneHomeDir(), 'state', 'version.json'),
    );
  });

  it('uses I18NPRUNE_HOME when set', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-version-path-'));
    process.env[ENV_I18NPRUNE_HOME] = root;
    expect(getUpdateStateFilePath()).toBe(path.join(path.resolve(root), 'state', 'version.json'));
    fs.rmSync(root, { recursive: true, force: true });
  });
});
