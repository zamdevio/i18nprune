import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { expandEffectiveFunctions } from '../index.js';
import { scanPropBoundLocals } from '../propHelpers.js';
import { scanProjectKeyObservations } from '../../keySites/orchestrate.js';

describe('scanPropBoundLocals (HOC §B)', () => {
  it('finds t in function and arrow param destructuring', () => {
    const text = `
function Row({ t, id }) {
  return t('row.label');
}
const Card = ({ t }) => t('card.title');
export async function Panel({ t }: Props) {
  return t('panel.x');
}
`;
    expect([...scanPropBoundLocals(text, ['t'])].sort()).toEqual(['t']);
  });

  it('ignores renamed destructuring and rest', () => {
    const text = `
function Row({ t: translate, ...rest }) {
  return translate('row.label');
}
`;
    expect(scanPropBoundLocals(text, ['t', 'translate']).size).toBe(0);
  });

  it('ignores local function t() declarations', () => {
    const text = `function t(key) { return key; }\nt('nope');\n`;
    expect(scanPropBoundLocals(text, ['t']).size).toBe(0);
  });
});

describe('expandEffectiveFunctions (HOC §B)', () => {
  it('does not add prop t when hoc is off (default)', () => {
    const text = `function Row({ t }) { return t('row.label'); }\n`;
    expect(expandEffectiveFunctions(['useTranslation'], text)).not.toContain('t');
  });

  it('adds prop t when hoc.enabled and propNames include t', () => {
    const text = `function Row({ t }) { return t('row.label'); }\n`;
    const effective = expandEffectiveFunctions(['useTranslation'], text, {
      enabled: true,
      propNames: ['t'],
    });
    expect(effective).toContain('t');
  });

  it('respects custom propNames', () => {
    const text = `function Row({ translate }) { return translate('row.label'); }\n`;
    const effective = expandEffectiveFunctions(['t'], text, {
      enabled: true,
      propNames: ['translate'],
    });
    expect(effective).toContain('translate');
    expect(
      expandEffectiveFunctions(['t'], text, { enabled: true, propNames: ['t'] }),
    ).not.toContain('translate');
  });
});

describe('scanProjectKeyObservations (HOC §B)', () => {
  it('finds literal via prop t only when hoc is enabled', () => {
    const rt = createNodeRuntimeAdapters();
    const srcRoot = '/proj/src';
    const file = path.join(srcRoot, 'row.ts');
    const text = `function Row({ t }) {\n  return t('prop.only');\n}\n`;

    const off = scanProjectKeyObservations({
      srcRoot,
      cwd: '/proj',
      path: rt.path,
      readFile: (fp) => (fp === file ? text : ''),
      listFiles: () => [file],
      functions: ['useTranslation'],
    });
    expect(off.some((o) => o.kind === 'literal')).toBe(false);

    const on = scanProjectKeyObservations({
      srcRoot,
      cwd: '/proj',
      path: rt.path,
      readFile: (fp) => (fp === file ? text : ''),
      listFiles: () => [file],
      functions: ['useTranslation'],
      hoc: { enabled: true, propNames: ['t'] },
    });
    const lit = on.find((o) => o.kind === 'literal');
    expect(lit?.kind).toBe('literal');
    if (lit?.kind === 'literal') expect(lit.resolvedKey).toBe('prop.only');
  });
});
