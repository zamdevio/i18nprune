import { describe, it, expect } from 'vitest';
import { resolveKeyPlaceholdersWithTrace } from '../resolve.js';

describe('resolveKeyPlaceholdersWithTrace', () => {
  it('returns a resolved key when all placeholders exist in constMap', () => {
    const m = { A: 'pages', B: 'x' };
    const frag = '${A}.${B}.y';
    expect(resolveKeyPlaceholdersWithTrace(frag, m).resolved).toBe('pages.x.y');
  });

  it('records substitution steps', () => {
    const r = resolveKeyPlaceholdersWithTrace('${NS}.z', { NS: 'app' });
    expect(r.resolved).toBe('app.z');
    expect(r.substitutions).toEqual([{ identifier: 'NS', value: 'app' }]);
  });
});

