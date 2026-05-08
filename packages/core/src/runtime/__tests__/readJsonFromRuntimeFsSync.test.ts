import { describe, expect, it } from 'vitest';
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

  it('propagates JSON syntax errors', () => {
    const fs: RuntimeFsPort = {
      exists: () => true,
      readText: () => 'not-json',
      statKind: () => 'file',
      listDir: () => [],
      writeText: () => {},
      deleteFile: () => {},
      mkdirp: () => {},
    };
    expect(() => readJsonFromRuntimeFsSync('/bad.json', fs)).toThrow(SyntaxError);
  });
});
