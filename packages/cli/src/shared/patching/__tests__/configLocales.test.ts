import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { repairPatchingConfigLocales } from '@/shared/patching/configLocales.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cli-config-locales-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

beforeEach(() => {
});

function makeConfig(): I18nPruneConfig {
  return {
    locales: {
      source: './locales/en.json',
      directory: './locales',
    },
    src: './src',
    functions: ['t'],
  };
}

describe('repairPatchingConfigLocales', () => {
  it('skips and does not mutate without --fix', async () => {
    const root = makeTempDir();
    const configPath = path.join(root, 'config.json');
    fs.writeFileSync(
      configPath,
      `${JSON.stringify(
        {
          locales: [{ code: 'ar', englishName: 'Arabic', nativeName: 'العربية' }],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    const rt = createNodeRuntimeAdapters();
    const out = await repairPatchingConfigLocales({
      config: makeConfig(),
      configPath,
      run: { json: false, jsonPretty: false, quiet: false, silent: false, debugScan: false, debugCache: false },
      fs: rt.fs,
    });
    const after = fs.readFileSync(configPath, 'utf8');

    expect(out.skipped).toBe(true);
    expect(out.autofilledCount).toBe(0);
    expect(out.correctedCount).toBe(0);
    expect(after).toContain('"code": "ar"');
    expect(after).not.toContain('"direction": "rtl"');
  });

  it('applies corrections when --fix is passed without prompt', async () => {
    const root = makeTempDir();
    const configPath = path.join(root, 'config.json');
    fs.writeFileSync(
      configPath,
      `${JSON.stringify(
        {
          locales: [{ code: 'ar', englishName: 'Arabic', nativeName: 'Arabic', direction: 'ltr' }],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    const rt = createNodeRuntimeAdapters();
    const out = await repairPatchingConfigLocales({
      config: makeConfig(),
      configPath,
      run: { json: false, jsonPretty: false, quiet: false, silent: false, debugScan: false, debugCache: false },
      fs: rt.fs,
      fix: true,
    });
    const after = fs.readFileSync(configPath, 'utf8');

    expect(out.skipped).toBe(false);
    expect(out.detectedCount).toBeGreaterThan(0);
    expect(after).toContain('"direction": "rtl"');
  });

  it('returns metadataRepairBlocked when config is not valid JSON', async () => {
    const root = makeTempDir();
    const configPath = path.join(root, 'config.json');
    fs.writeFileSync(configPath, '{ not json', 'utf8');
    const rt = createNodeRuntimeAdapters();
    const out = await repairPatchingConfigLocales({
      config: makeConfig(),
      configPath,
      run: { json: false, jsonPretty: false, quiet: false, silent: false, debugScan: false, debugCache: false },
      fs: rt.fs,
      fix: true,
    });
    expect(out.metadataRepairBlocked).toBe('parse_error');
    expect(out.detectedCount).toBe(0);
    expect(fs.readFileSync(configPath, 'utf8')).toBe('{ not json');
  });
});
