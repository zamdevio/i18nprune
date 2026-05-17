import { describe, it, expect } from 'vitest';
import { expandFunctionsWithBindings } from '../expand.js';
import { scanImportBindings } from '../imports.js';

describe('scanImportBindings', () => {
  it('records named import { t }', () => {
    const text = `import { t } from './i18n';\n`;
    expect(scanImportBindings(text)).toEqual([{ kind: 'named', imported: 't', local: 't', source: 'esm' }]);
  });

  it('records named import { t as newT }', () => {
    const text = `import { t as newT } from './i18n';\n`;
    expect(scanImportBindings(text)).toEqual([{ kind: 'named', imported: 't', local: 'newT', source: 'esm' }]);
  });

  it('records default import as module', () => {
    const text = `import i18n from './i18n';\n`;
    expect(scanImportBindings(text)).toEqual([
      { kind: 'module', local: 'i18n', moduleKind: 'default', source: 'esm' },
    ]);
  });

  it('records namespace import as module', () => {
    const text = `import * as i18n from './i18n';\n`;
    expect(scanImportBindings(text)).toEqual([
      { kind: 'module', local: 'i18n', moduleKind: 'namespace', source: 'esm' },
    ]);
  });

  it('records default + named import', () => {
    const text = `import i18n, { t } from './i18n';\n`;
    expect(scanImportBindings(text)).toEqual([
      { kind: 'module', local: 'i18n', moduleKind: 'default', source: 'esm' },
      { kind: 'named', imported: 't', local: 't', source: 'esm' },
    ]);
  });

  it('records CJS require destructuring', () => {
    const text = `const { t } = require('./i18n');\n`;
    expect(scanImportBindings(text)).toEqual([
      { kind: 'named', imported: 't', local: 't', source: 'cjs_require' },
    ]);
  });

  it('records CJS require destructuring with rename', () => {
    const text = `const { t: newT } = require('./i18n');\n`;
    expect(scanImportBindings(text)).toEqual([
      { kind: 'named', imported: 't', local: 'newT', source: 'cjs_require' },
    ]);
  });

  it('records CJS require module binding', () => {
    expect(scanImportBindings(`const i18n = require('./i18n');`)).toEqual([
      { kind: 'module', local: 'i18n', moduleKind: 'default', source: 'cjs_require' },
    ]);
  });

  it('records dynamic import destructuring', () => {
    expect(scanImportBindings(`const { t } = await import('./m');`)).toEqual([
      { kind: 'named', imported: 't', local: 't', source: 'dynamic_import' },
    ]);
  });

  it('records dynamic import module binding', () => {
    expect(scanImportBindings(`const mod = await import('./x');`)).toEqual([
      { kind: 'module', local: 'mod', moduleKind: 'default', source: 'dynamic_import' },
    ]);
  });

  it('records dynamic import module without await', () => {
    expect(scanImportBindings(`const mod = import('./x');`)).toEqual([
      { kind: 'module', local: 'mod', moduleKind: 'default', source: 'dynamic_import' },
    ]);
  });

  it('records TypeScript import = require', () => {
    expect(scanImportBindings(`import i18n = require('./x');`)).toEqual([
      { kind: 'module', local: 'i18n', moduleKind: 'default', source: 'ts_import_equals' },
    ]);
  });

  it('records import type { … } as type-only named bindings', () => {
    const text = `import type { TFunction } from './types';\n`;
    expect(scanImportBindings(text)).toEqual([
      { kind: 'named', imported: 'TFunction', local: 'TFunction', source: 'esm', isTypeOnly: true },
    ]);
  });

  it('skips import type { … } in the runtime ESM named scan', () => {
    const text = `import type { TFunction } from './types';\n`;
    const runtimeNamed = scanImportBindings(text).filter((b) => b.kind === 'named' && b.isTypeOnly !== true);
    expect(runtimeNamed).toEqual([]);
  });

  it('returns empty when there are no import forms', () => {
    const text = `const x = 1;\nexport const y = x + 1;\n`;
    expect(scanImportBindings(text)).toEqual([]);
  });

  it('records unicode and $ identifiers in named imports', () => {
    const text = `import { t as $tr, ü as uu } from './m';\n`;
    expect(scanImportBindings(text)).toEqual([
      { kind: 'named', imported: 't', local: '$tr', source: 'esm' },
      { kind: 'named', imported: 'ü', local: 'uu', source: 'esm' },
    ]);
  });

  it('does not treat import-like text inside line comments as bindings', () => {
    const text = `// import { t } from 'ghost'\nimport { t as tr } from 'a';\n`;
    expect(scanImportBindings(text)).toEqual([{ kind: 'named', imported: 't', local: 'tr', source: 'esm' }]);
  });

  it('records import { default as i18n }', () => {
    expect(scanImportBindings(`import { default as i18n } from './pkg';`)).toEqual([
      { kind: 'module', local: 'i18n', moduleKind: 'default', source: 'esm' },
    ]);
  });

  it('does not match import text inside template literals', () => {
    const text = 'const x = `\nimport { t } from "ghost"\n`;\nimport { t as tr } from "a";\n';
    expect(scanImportBindings(text)).toEqual([{ kind: 'named', imported: 't', local: 'tr', source: 'esm' }]);
  });

  it('dedupes repeated identical ESM named imports', () => {
    const text = `import { t } from 'x';\nimport { t } from 'x';\n`;
    expect(scanImportBindings(text)).toEqual([{ kind: 'named', imported: 't', local: 't', source: 'esm' }]);
  });

  it('dedupes repeated identical CJS require module bindings', () => {
    const text = `const i18n = require('x');\nconst i18n = require('x');\n`;
    expect(scanImportBindings(text)).toEqual([
      { kind: 'module', local: 'i18n', moduleKind: 'default', source: 'cjs_require' },
    ]);
  });
});

describe('scanImportBindings malformed / junk syntax', () => {
  it('returns empty for clearly broken import lines (fail-safe)', () => {
    const text = `import { from 'x'
import { t as } from 'x'
const { t: } = require('x')
`;
    expect(scanImportBindings(text)).toEqual([]);
  });
});

describe('expandFunctionsWithBindings', () => {
  it('adds local alias for configured imported name', () => {
    const bindings = scanImportBindings(`import { t as newT } from 'x';`);
    expect(expandFunctionsWithBindings(['t'], bindings)).toEqual(['t', 'newT']);
  });

  it('adds dot, optional-chaining, and bracket member variants for module roots', () => {
    const bindings = scanImportBindings(`
import i18n from './a';
import * as ns from './b';
`);
    const expanded = expandFunctionsWithBindings(['t'], bindings);
    expect(expanded[0]).toBe('t');
    expect(new Set(expanded)).toEqual(
      new Set([
        't',
        'i18n.t',
        'i18n?.t',
        `i18n['t']`,
        'i18n["t"]',
        `i18n?.['t']`,
        'i18n?.["t"]',
        'ns.t',
        'ns?.t',
        `ns['t']`,
        'ns["t"]',
        `ns?.['t']`,
        'ns?.["t"]',
      ]),
    );
    expect(expanded).toHaveLength(13);
  });

  it('expands module methods using imported names when only a local alias is configured', () => {
    const bindings = scanImportBindings(`
import * as i18n from 'i18next';
import { t as translate } from 'i18next';
`);
    const expanded = expandFunctionsWithBindings(['translate'], bindings);
    expect(expanded[0]).toBe('translate');
    expect(expanded).toContain('i18n.t');
    expect(expanded).toContain(`i18n['t']`);
    expect(expanded).toContain('translate');
  });

  it('includes alias-driven method suffixes when configured with the canonical imported name', () => {
    const bindings = scanImportBindings(`
import * as z from './z';
import * as a from './a';
import { t as b } from './c';
`);
    const expanded = expandFunctionsWithBindings(['t'], bindings);
    expect(expanded[0]).toBe('t');
    expect(new Set(expanded)).toEqual(
      new Set([
        't',
        'b',
        'a.t',
        'a?.t',
        `a['t']`,
        'a["t"]',
        `a?.['t']`,
        'a?.["t"]',
        'a.b',
        'a?.b',
        `a['b']`,
        'a["b"]',
        `a?.['b']`,
        'a?.["b"]',
        'z.t',
        'z?.t',
        `z['t']`,
        'z["t"]',
        `z?.['t']`,
        'z?.["t"]',
        'z.b',
        'z?.b',
        `z['b']`,
        'z["b"]',
        `z?.['b']`,
        'z?.["b"]',
      ]),
    );
    expect(expanded).toHaveLength(26);
  });

  it('does not add alias when configured name is not imported', () => {
    const bindings = scanImportBindings(`import { other as x } from 'm';`);
    expect(expandFunctionsWithBindings(['t'], bindings)).toEqual(['t']);
  });

  it('ignores type-only bindings when expanding', () => {
    const bindings = scanImportBindings(`
import type { TFunction } from './t';
import { t as tr } from './u';
`);
    expect(expandFunctionsWithBindings(['t', 'TFunction'], bindings)).toEqual(['t', 'TFunction', 'tr']);
  });
});
