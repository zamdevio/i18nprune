import { describe, expect, it } from 'vitest';

import { groupDynamicKeySites } from '../groups.js';

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
