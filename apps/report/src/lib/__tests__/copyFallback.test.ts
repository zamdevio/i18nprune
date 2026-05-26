import { describe, it, expect } from 'vitest';
import { copyPathForFallback } from '../open-in-editor/paths/copyFallback.js';

describe('copyPathForFallback', () => {
  it('copies payload-relative path for synthetic cwd', () => {
    expect(
      copyPathForFallback({ cwd: '/project', payloadPath: 'src/App.tsx' }),
    ).toBe('src/App.tsx');
  });

  it('copies resolved absolute for real cwd', () => {
    expect(
      copyPathForFallback({ cwd: '/home/proj', payloadPath: 'src/App.tsx' }),
    ).toBe('/home/proj/src/App.tsx');
  });
});
