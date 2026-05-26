import { describe, it, expect } from 'vitest';
import { buildEditorHref } from '../editor/index.js';

describe('buildEditorHref', () => {
  it('builds vscode and cursor URIs for posix paths', () => {
    expect(buildEditorHref('/home/proj/src/a.ts', 'vscode')).toBe('vscode://file/home/proj/src/a.ts');
    expect(buildEditorHref('/home/proj/src/a.ts', 'cursor')).toBe('cursor://file/home/proj/src/a.ts');
  });

  it('builds antigravity, windsurf, and zed URIs', () => {
    expect(buildEditorHref('/tmp/x', 'antigravity')).toBe('antigravity://file/tmp/x');
    expect(buildEditorHref('/tmp/x', 'windsurf')).toBe('windsurf://file/tmp/x');
    expect(buildEditorHref('/tmp/x', 'zed')).toBe('zed://file/tmp/x');
  });
});
