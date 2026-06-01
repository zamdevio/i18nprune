import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { UPDATE_STATE_SCHEMA_VERSION } from '@/constants/update.js';
import { ENV_I18NPRUNE_HOME } from '@/constants/env.js';
import { readUpdateState } from '../cache.js';
import { getUpdateStateFilePath } from '../paths.js';

const REGISTRY = 'https://registry.npmjs.org/i18nprune/latest';

describe('readUpdateState legacy migration', () => {
  const prevHome = process.env[ENV_I18NPRUNE_HOME];
  const prevXdg = process.env.XDG_CONFIG_HOME;
  let homeRoot: string;
  let xdgRoot: string;

  afterEach(() => {
    if (homeRoot) fs.rmSync(homeRoot, { recursive: true, force: true });
    if (xdgRoot) fs.rmSync(xdgRoot, { recursive: true, force: true });
    if (prevHome === undefined) delete process.env[ENV_I18NPRUNE_HOME];
    else process.env[ENV_I18NPRUNE_HOME] = prevHome;
    if (prevXdg === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = prevXdg;
  });

  it('migrates legacy XDG updatestate.json to home/state/version.json', () => {
    homeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-migrate-home-'));
    xdgRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-migrate-xdg-'));
    process.env[ENV_I18NPRUNE_HOME] = homeRoot;
    process.env.XDG_CONFIG_HOME = xdgRoot;

    const legacyPath = path.join(xdgRoot, 'i18nprune', 'updatestate.json');
    fs.mkdirSync(path.dirname(legacyPath), { recursive: true });
    fs.writeFileSync(
      legacyPath,
      `${JSON.stringify({
        schemaVersion: UPDATE_STATE_SCHEMA_VERSION,
        lastAttemptMs: 42,
        lastSuccessMs: 42,
        latestRegistryVersion: '1.2.3',
        lastError: null,
        registryEndpoint: REGISTRY,
        cliVersionWhenRecorded: '0.1.0',
      })}\n`,
      'utf8',
    );

    const read = readUpdateState(REGISTRY);
    expect(read.latestRegistryVersion).toBe('1.2.3');

    const canonical = getUpdateStateFilePath();
    expect(fs.existsSync(canonical)).toBe(true);
    expect(JSON.parse(fs.readFileSync(canonical, 'utf8')).latestRegistryVersion).toBe('1.2.3');
  });
});
