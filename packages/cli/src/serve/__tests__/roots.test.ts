import path from 'node:path';
import os from 'node:os';
import { describe, expect, it } from 'vitest';
import { normalizeServeRoot, resolveRequestRoot } from '@/serve/roots.js';

describe('serve root modes', () => {
  const sandbox = { mode: 'sandbox', root: path.resolve('/srv/proj') } as const;

  it('sandbox: omitted or matching root resolves to the pin', () => {
    expect(resolveRequestRoot(sandbox)).toEqual({ ok: true, root: sandbox.root });
    expect(resolveRequestRoot(sandbox, sandbox.root)).toEqual({ ok: true, root: sandbox.root });
  });

  it('sandbox: a different absolute root is confined, never a silent switch', () => {
    expect(resolveRequestRoot(sandbox, path.resolve('/srv/other'))).toEqual({ ok: false, reason: 'confined' });
  });

  it('sandbox: a non-absolute root is rejected as relative', () => {
    expect(resolveRequestRoot(sandbox, 'relative/dir')).toEqual({ ok: false, reason: 'relative' });
  });

  it('hub: a root is required', () => {
    expect(resolveRequestRoot({ mode: 'hub' })).toEqual({ ok: false, reason: 'required' });
    expect(resolveRequestRoot({ mode: 'hub' }, '')).toEqual({ ok: false, reason: 'required' });
  });

  it('hub: honours an absolute root and normalizes it', () => {
    const p = path.resolve('/home/me/proj/../proj');
    const r = resolveRequestRoot({ mode: 'hub' }, p);
    expect(r).toEqual({ ok: true, root: path.resolve('/home/me/proj') });
  });

  it('hub: rejects a relative root', () => {
    expect(resolveRequestRoot({ mode: 'hub' }, 'proj')).toEqual({ ok: false, reason: 'relative' });
  });
});

describe('normalizeServeRoot', () => {
  it('expands a leading tilde to the home directory', () => {
    expect(normalizeServeRoot('~')).toBe(path.resolve(os.homedir()));
    expect(normalizeServeRoot('~/proj')).toBe(path.join(os.homedir(), 'proj'));
  });

  it('resolves a relative path against cwd', () => {
    expect(normalizeServeRoot('sub/dir')).toBe(path.resolve('sub/dir'));
  });
});
