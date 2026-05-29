import { describe, expect, it } from 'vitest';
import { getProjectedLeafString, projectLocaleLeaves } from '../projection.js';
import { setAtPath } from '../../json/path.js';

describe('projectLocaleLeaves', () => {
  it('treats dotted keys as paths and prefers nested on conflict', () => {
    const raw = {
      'routes.index.title': 'flat',
      routes: { index: { title: 'nested' } },
    };
    const proj = projectLocaleLeaves(raw);
    expect(getProjectedLeafString(proj, 'routes.index.title')).toBe('nested');
    expect(proj.conflicts).toBeGreaterThanOrEqual(1);
  });

  it('does not introduce dotted keys when materializing nested paths', () => {
    const out = setAtPath({}, 'routes.index.title', 'X') as any;
    expect(out['routes.index.title']).toBeUndefined();
    expect(out.routes.index.title).toBe('X');
  });
});

