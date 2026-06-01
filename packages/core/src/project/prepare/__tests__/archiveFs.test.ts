import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { createArchiveProjectFs } from '../archiveFs.js';

describe('createArchiveProjectFs', () => {
  it('reads and lists files when host paths are resolved on Windows-style cwd', () => {
    const adapters = createNodeRuntimeAdapters();
    const textFiles = {
      'locales/en.json': '{}',
      'src/app.ts': 'export {}',
    };
    const fs = createArchiveProjectFs(textFiles, adapters.path, '/project');
    const srcRoot = adapters.path.resolve('/project', 'src');
    const listed = fs.listFiles(srcRoot);
    expect(listed.some((p) => p.endsWith('app.ts') || p.includes('app.ts'))).toBe(true);
    const enAbs = adapters.path.resolve('/project', 'locales/en.json');
    expect(fs.readFile(enAbs)).toBe('{}');
  });

  it('maps relative keys with posix zip paths', () => {
    const adapters = createNodeRuntimeAdapters();
    const fs = createArchiveProjectFs({ 'locales/en.json': '{"a":"A"}' }, adapters.path, path.join('C:', 'project'));
    const abs = adapters.path.resolve(path.join('C:', 'project'), 'locales', 'en.json');
    expect(fs.readFile(abs)).toBe('{"a":"A"}');
  });
});
