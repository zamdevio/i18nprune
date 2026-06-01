import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { UPDATE_STATE_SCHEMA_VERSION } from '@/constants/update.js';
import { ENV_I18NPRUNE_HOME } from '@/constants/env.js';
import { readUpdateState, resetUpdateState, writeUpdateState } from '../cache.js';
import { getUpdateStateFilePath } from '../paths.js';

const REGISTRY = 'https://registry.npmjs.org/i18nprune/latest';

describe('update state disk IO', () => {
  const prevHome = process.env[ENV_I18NPRUNE_HOME];
  let tempRoot: string;

  afterEach(() => {
    if (tempRoot) fs.rmSync(tempRoot, { recursive: true, force: true });
    if (prevHome === undefined) delete process.env[ENV_I18NPRUNE_HOME];
    else process.env[ENV_I18NPRUNE_HOME] = prevHome;
  });

  it('creates state dir and round-trips version.json', () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-update-state-'));
    process.env[ENV_I18NPRUNE_HOME] = tempRoot;

    const written = {
      schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
      lastAttemptMs: 1_700_000_000_000,
      lastSuccessMs: 1_700_000_000_000,
      latestRegistryVersion: '9.9.9',
      lastError: null,
      registryEndpoint: REGISTRY,
      cliVersionWhenRecorded: '0.1.0',
    };
    writeUpdateState(written);

    const filePath = getUpdateStateFilePath();
    expect(filePath).toBe(path.join(path.resolve(tempRoot), 'state', 'version.json'));
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).isFile()).toBe(true);

    const read = readUpdateState(REGISTRY);
    expect(read).toEqual(written);
  });

  it('resetUpdateState removes the canonical file', () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-update-reset-'));
    process.env[ENV_I18NPRUNE_HOME] = tempRoot;

    writeUpdateState({
      schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
      lastAttemptMs: 0,
      lastSuccessMs: null,
      latestRegistryVersion: null,
      lastError: null,
      registryEndpoint: REGISTRY,
      cliVersionWhenRecorded: null,
    });
    const filePath = getUpdateStateFilePath();
    expect(fs.existsSync(filePath)).toBe(true);

    resetUpdateState();
    expect(fs.existsSync(filePath)).toBe(false);
  });
});
