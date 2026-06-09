import { describe, expect, it } from 'vitest';

import { groupDynamicKeySites, splitDynamicSiteCounts } from '../groups.js';

describe('groupDynamicKeySites (E.6c)', () => {
  it('groups mixed templates separately from plain non_literal sites', () => {
    const groups = groupDynamicKeySites([
      {
        kind: 'template_interpolation',
        functionName: 't',
        preview: 't(`a.${x}`)',
        classification: 'mixed_const_runtime',
      },
      { kind: 'non_literal', functionName: 't', preview: 't(key)' },
      { kind: 'commented', functionName: 't', preview: '// t(x)' },
    ]);
    expect(groups).toEqual({
      mixedConstRuntime: 1,
      templateInterpolation: 1,
      nonLiteral: 1,
      emptyCall: 0,
      commented: 1,
    });
  });
});

describe('splitDynamicSiteCounts (D.1)', () => {
  it('splits active vs commented totals', () => {
    const sites = [
      { kind: 'non_literal' as const, functionName: 't', preview: 't(key)' },
      { kind: 'commented' as const, functionName: 't', preview: '// t(x)' },
      { kind: 'template_interpolation' as const, functionName: 't', preview: 't(`a.${x}`)' },
    ];
    expect(splitDynamicSiteCounts(sites)).toEqual({ total: 3, active: 2, commented: 1 });
  });
});
