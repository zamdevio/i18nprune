import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { expandEffectiveFunctions, expandWithLocalHelpers, scanImportBindings } from '../index.js';
import { expandFunctionsWithBindings } from '../expand.js';
import { scanProjectKeyObservations } from '../../keySites/orchestrate.js';

describe('expandWithLocalHelpers (HOC §A)', () => {
  it('adds one-hop alias from imported t', () => {
    const text = `import { t } from 'i18next';\nconst tt = t;\ntt('alias.key');\n`;
    const bindings = scanImportBindings(text);
    const fromImports = expandFunctionsWithBindings(['t'], bindings);
    const effective = expandWithLocalHelpers(fromImports, ['t'], text, bindings);
    expect(effective).toContain('tt');
    expect(expandEffectiveFunctions(['t'], text)).toContain('tt');
  });

  it('adds one-hop alias from member helper i18n.t', () => {
    const text = `import * as i18n from 'i18next';\nconst translate = i18n.t;\ntranslate('m.key');\n`;
    const effective = expandEffectiveFunctions(['t'], text);
    expect(effective).toContain('i18n.t');
    expect(effective).toContain('translate');
  });

  it('does not multi-hop', () => {
    const text = `import { t } from 'i18next';\nconst a = t;\nconst b = a;\nb('x');\n`;
    const effective = expandEffectiveFunctions(['t'], text);
    expect(effective).toContain('a');
    expect(effective).not.toContain('b');
  });

  it('does not promote ternary RHS', () => {
    const text = `import { t } from 'i18next';\nconst fn = cond ? t : g;\nfn('x');\n`;
    const effective = expandEffectiveFunctions(['t'], text);
    expect(effective).not.toContain('fn');
  });

  it('adds t from useTranslation when hook is configured', () => {
    const text = `import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();\nt('hook.key');\n`;
    const effective = expandEffectiveFunctions(['useTranslation'], text);
    expect(effective).toContain('t');
  });

  it('adds t from useTranslations direct assign when hook configured', () => {
    const text = `import { useTranslations } from 'next-intl';\nconst t = useTranslations();\nt('ns.key');\n`;
    const effective = expandEffectiveFunctions(['useTranslations'], text);
    expect(effective).toContain('t');
  });

  it('does not add hook bind without configured t or hook name', () => {
    const text = `import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();\nt('hook.key');\n`;
    const effective = expandEffectiveFunctions(['formatMessage'], text);
    expect(effective).not.toContain('t');
  });

  it('skips hook bind when hook is not imported', () => {
    const text = `const { t } = useTranslation();\nt('hook.key');\n`;
    const effective = expandEffectiveFunctions(['useTranslation', 't'], text);
    // `t` stays from configured; no extra discovery required — ensure we don't explode
    expect(effective).toContain('t');
  });
});

describe('scanProjectKeyObservations (HOC §A)', () => {
  it('finds literal via one-hop alias', () => {
    const rt = createNodeRuntimeAdapters();
    const srcRoot = '/proj/src';
    const file = path.join(srcRoot, 'app.ts');
    const text = `import { t } from './i18n';\nconst tt = t;\ntt('alias.literal.key');\n`;
    const obs = scanProjectKeyObservations({
      srcRoot,
      cwd: '/proj',
      path: rt.path,
      readFile: (fp) => (fp === file ? text : ''),
      listFiles: () => [file],
      functions: ['t'],
    });
    const lit = obs.find((o) => o.kind === 'literal');
    expect(lit?.kind).toBe('literal');
    if (lit?.kind === 'literal') expect(lit.resolvedKey).toBe('alias.literal.key');
  });

  it('finds literal via useTranslation when only hook is configured', () => {
    const rt = createNodeRuntimeAdapters();
    const srcRoot = '/proj/src';
    const file = path.join(srcRoot, 'app.ts');
    const text = `import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();\nt('hook.only');\n`;
    const obs = scanProjectKeyObservations({
      srcRoot,
      cwd: '/proj',
      path: rt.path,
      readFile: (fp) => (fp === file ? text : ''),
      listFiles: () => [file],
      functions: ['useTranslation'],
    });
    const lit = obs.find((o) => o.kind === 'literal');
    expect(lit?.kind).toBe('literal');
    if (lit?.kind === 'literal') expect(lit.resolvedKey).toBe('hook.only');
  });
});
