import { describe, expect, it } from 'vitest';
import { buildCliJsonEnvelope, stringifyCliCommandJson } from '@/shared/result/cliJson.js';

describe('stringifyCliCommandJson', () => {
  it('always wraps in envelope', () => {
    const s = stringifyCliCommandJson({
      kind: 'validate',
      data: { missing: ['a'] },
      ok: false,
    });
    const j = JSON.parse(s) as {
      ok: boolean;
      kind: string;
      data: { missing: string[] };
      issues: unknown[];
      meta: { apiVersion: string };
    };
    expect(j.ok).toBe(false);
    expect(j.kind).toBe('validate');
    expect(j.data.missing).toEqual(['a']);
    expect(Array.isArray(j.issues)).toBe(true);
    expect(j.meta.apiVersion).toBe('1');
  });

  it('pretty-prints when pretty is true', () => {
    const s = stringifyCliCommandJson({
      kind: 'config',
      data: { x: 1 },
      ok: true,
      pretty: true,
    });
    expect(s).toContain('\n');
  });
});

describe('buildCliJsonEnvelope', () => {
  it('includes optional schemaVersion', () => {
    const e = buildCliJsonEnvelope('sync', { x: 1 }, {
      ok: true,
      schemaVersion: 'sync.v1',
      cwd: '/tmp',
    });
    expect(e.meta.schemaVersion).toBe('sync.v1');
    expect(e.meta.cwd).toBe('/tmp');
  });
});
