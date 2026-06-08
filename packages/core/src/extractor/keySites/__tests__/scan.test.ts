import { describe, it, expect } from 'vitest';
import { exactLiteralKeys } from '../../shared/literals.js';
import { resolvedKeysFromObservations, scanKeyObservations } from '../scan.js';

describe('scanKeyObservations', () => {
  it('matches exactLiteralKeys set for literals + templates', () => {
    const text = `
import { t } from 'x';
const NS = 'pages.app';
export const a = t('a.b') + t(\`\${NS}.title\`);
`;
    const constMap = { NS: 'pages.app' };
    const functions = ['t'];
    const set = exactLiteralKeys(text, functions, constMap);
    const fromObs = resolvedKeysFromObservations(scanKeyObservations(text, functions, constMap));
    expect(fromObs).toEqual(set);
    expect(set.has('a.b')).toBe(true);
    expect(set.has('pages.app.title')).toBe(true);
  });

  it('emits template_partial when const is missing', () => {
    const text = 't(`${NS}.x`)';
    const obs = scanKeyObservations(text, ['t'], {});
    expect(obs.some((o) => o.kind === 'template_partial')).toBe(true);
  });

  it('links template_partial to dynamic via dynamicRef', () => {
    const text = "const M = 'orders';\nt(`${M}.statuses.${data.status}`);";
    const obs = scanKeyObservations(text, ['t'], { M: 'orders' });
    const partial = obs.find((o) => o.kind === 'template_partial');
    expect(partial?.dynamicRef).toEqual({ line: 2 });
    if (partial?.kind === 'template_partial') {
      expect(partial.uncertainPrefix).toBe('orders.statuses');
    }
  });

  it('records line numbers', () => {
    const text = "line1\nline2\nt('x.y')\n";
    const obs = scanKeyObservations(text, ['t'], {});
    const lit = obs.find((o) => o.kind === 'literal');
    expect(lit?.span.line).toBe(3);
  });

  it('handles multiline calls with comments and keeps multiline metadata', () => {
    const text = `
t(
  /* translator key */
  'pages.home.title',
  // options comment
  { x: 1 },
);
`;
    const obs = scanKeyObservations(text, ['t'], {});
    const lit = obs.find((o) => o.kind === 'literal');
    expect(lit?.span.isMultilineCall).toBe(true);
    if (lit?.kind === 'literal') {
      expect(lit.resolvedKey).toBe('pages.home.title');
    }
  });
});

