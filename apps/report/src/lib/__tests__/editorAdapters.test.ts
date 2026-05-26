import { describe, it, expect } from 'vitest';
import { getEditorAdapter } from '../open-in-editor/adapters/registry.js';
import { presentPathForOpen } from '../open-in-editor/paths/present.js';
import { buildOpenUri } from '../open-in-editor/buildOpenUri.js';

describe('editor adapters', () => {
  it('vscode serializes posix paths', () => {
    const uri = getEditorAdapter('vscode').buildUri({ path: '/home/proj/src/a.ts' });
    expect(uri).toBe('vscode://file/home/proj/src/a.ts');
  });

  it('each editor uses its own scheme', () => {
    expect(getEditorAdapter('cursor').buildUri({ path: '/tmp/x' })).toBe('cursor://file/tmp/x');
    expect(getEditorAdapter('antigravity').buildUri({ path: '/tmp/x' })).toBe('antigravity://file/tmp/x');
    expect(getEditorAdapter('windsurf').buildUri({ path: '/tmp/x' })).toBe('windsurf://file/tmp/x');
    expect(getEditorAdapter('zed').buildUri({ path: '/tmp/x' })).toBe('zed://file/tmp/x');
  });
});

describe('buildOpenUri', () => {
  it('returns ok:false when policy denies', () => {
    const result = buildOpenUri({
      policy: { allow: false, reason: 'wsl-cross-host-unsupported' },
      generatorFamily: 'linux-wsl',
      editorId: 'vscode',
      cwd: '/home/p',
      payloadPath: 'src/a.ts',
    });
    expect(result).toEqual({ ok: false });
  });

  it('builds uri when policy allows', () => {
    const result = buildOpenUri({
      policy: { allow: true, bridge: 'native' },
      generatorFamily: 'linux',
      editorId: 'vscode',
      cwd: '/home/proj',
      payloadPath: 'src/a.ts',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.uri).toBe('vscode://file/home/proj/src/a.ts');
    }
  });
});

describe('presentPathForOpen', () => {
  it('keeps posix paths for linux generator', () => {
    expect(
      presentPathForOpen({
        target: { absolutePath: '/home/x.ts' },
        generatorFamily: 'linux',
        bridge: 'native',
      }),
    ).toBe('/home/x.ts');
  });
});
