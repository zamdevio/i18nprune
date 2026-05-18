import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { buildLocaleRecordsForScaffold } from '@/shared/patching/scaffoldI18nLayout.js';
import type { Context } from '@/types/core/context/index.js';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scaffold-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function makeContext(root: string): Context {
  const adapters = createNodeRuntimeAdapters();
  return {
    config: {
      locales: { source: './locales/en.json', directory: './locales' },
      src: './src',
      functions: ['t'],
    },
    paths: {
      sourceLocale: path.join(root, 'locales', 'en.json'),
      localesDir: path.join(root, 'locales'),
      srcRoot: path.join(root, 'src'),
    },
    run: { json: false, jsonPretty: false, quiet: false, silent: false, debugScan: false, debugCache: false },
    meta: {
      fieldSources: {},
      configFileLoaded: true,
      warnings: [],
      cache: {
        enabled: false,
        reason: 'default',
        rootDir: '',
        metaPath: '',
        projectId: '',
        projectRoot: root,
        projectDir: '',
        filesPath: '',
        analysisPath: '',
        readOnly: false,
      },
    },
    adapters,
  };
}

describe('buildLocaleRecordsForScaffold', () => {
  it('always includes direction field', () => {
    const root = makeTempDir();
    fs.mkdirSync(path.join(root, 'locales'), { recursive: true });
    fs.writeFileSync(path.join(root, 'locales', 'en.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(root, 'locales', 'ar.json'), '{}', 'utf8');
    const ctx = makeContext(root);
    const records = buildLocaleRecordsForScaffold(ctx);
    expect(records.length).toBeGreaterThan(0);
    for (const row of records) {
      expect(row.direction === 'ltr' || row.direction === 'rtl').toBe(true);
    }
  });
});
