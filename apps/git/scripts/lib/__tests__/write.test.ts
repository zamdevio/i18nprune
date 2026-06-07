import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { writeJsonIfChanged } from '../write.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('writeJsonIfChanged', () => {
  it('skips write when serialized content is unchanged', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-write-'));
    tempDirs.push(dir);
    const filePath = path.join(dir, 'out.json');
    expect(writeJsonIfChanged(filePath, { a: 1 })).toBe(true);
    const mtime1 = fs.statSync(filePath).mtimeMs;
    expect(writeJsonIfChanged(filePath, { a: 1 })).toBe(false);
    expect(fs.statSync(filePath).mtimeMs).toBe(mtime1);
  });
});
