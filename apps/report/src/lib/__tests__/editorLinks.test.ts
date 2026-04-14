import { describe, it, expect } from 'vitest';
import { buildEditorHref } from '../editor/index.js';

describe('buildEditorHref', () => {
  it('builds vscode and cursor URIs for posix paths', () => {
    expect(buildEditorHref('/home/proj/src/a.ts', 'vscode')).toBe('vscode://file/home/proj/src/a.ts');
    expect(buildEditorHref('/home/proj/src/a.ts', 'cursor')).toBe('cursor://file/home/proj/src/a.ts');
  });

  it('builds file URLs', () => {
    expect(buildEditorHref('/tmp/x', 'file')).toBe('file:///tmp/x');
  });
});
