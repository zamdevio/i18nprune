import { describe, expect, it } from 'vitest';
import { I18nPruneJsonParseError } from '../../shared/json/parse.js';
import { readJsonFromRuntimeFsSync } from '../helpers/sync/readJson.js';
import type { RuntimeFsPort } from '../../types/runtime/fs.js';

describe('readJsonFromRuntimeFsSync', () => {
  it('parses JSON from synchronous readText', () => {
    const fs: RuntimeFsPort = {
      exists: () => true,
      readText: () => '{"a":1}',
      statKind: () => 'file',
      listDir: () => [],
      writeText: () => {},
      deleteFile: () => {},
      mkdirp: () => {},
    };
    expect(readJsonFromRuntimeFsSync('/x.json', fs)).toEqual({ a: 1 });
  });

  it('rejects async readText (Promise)', () => {
    const fs: RuntimeFsPort = {
      exists: () => true,
      readText: () => Promise.resolve('{}'),
      statKind: () => 'file',
      listDir: () => [],
      writeText: () => {},
      deleteFile: () => {},
      mkdirp: () => {},
    };
    expect(() => readJsonFromRuntimeFsSync('/y.json', fs)).toThrow(/Synchronous fs\.readText/);
  });

  it('reports JSON syntax errors with file and location context', () => {
    const fs: RuntimeFsPort = {
      exists: () => true,
      readText: () => '{\n  "ok": true,\n}',
      statKind: () => 'file',
      listDir: () => [],
      writeText: () => {},
      deleteFile: () => {},
      mkdirp: () => {},
    };
    expect(() => readJsonFromRuntimeFsSync('/bad.json', fs)).toThrow(I18nPruneJsonParseError);
    expect(() => readJsonFromRuntimeFsSync('/bad.json', fs)).toThrow(/\/bad\.json.*line \d+, column \d+/);
  });
});
