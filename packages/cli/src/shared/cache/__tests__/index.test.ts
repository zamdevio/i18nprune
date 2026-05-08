import { describe, expect, it } from 'vitest';
import { computeProjectId } from '../index.js';

describe('shared/cache index exports', () => {
  it('computes stable project ids', () => {
    const a = computeProjectId('/tmp/app');
    const b = computeProjectId('/tmp/app');
    const c = computeProjectId('/tmp/other');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[a-f0-9]{16}$/);
  });
});
