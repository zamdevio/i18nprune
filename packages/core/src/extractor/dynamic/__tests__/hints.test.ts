import { describe, expect, it } from 'vitest';

import { nonLiteralHintsForCall } from '../hints.js';
import { findDynamicKeySitesInJavascriptMergedText } from '../providers/javascript.js';
import { buildAssignmentLedger } from '../../constmap/assignments.js';

describe('non_literal hints (E.3)', () => {
  it('hints when a local was assigned from a fully resolved template', () => {
    const text = `
const NS = 'app';
const key = \`\${NS}.greeting\`;
t(key);
`;
    expect(nonLiteralHintsForCall(text, 'key')).toEqual({
      resolvedViaConstAssignment: 'app.greeting',
    });
    const sites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);
    const site = sites.find((s) => s.kind === 'non_literal');
    expect(site?.resolvedViaConstAssignment).toBe('app.greeting');
  });

  it('hints branch literals for ternary-assigned locals', () => {
    const text = `
const NS = 'app';
const greetingKey = isLoggedIn ? \`\${NS}.greeting\` : 'notifications.logout';
t(greetingKey);
`;
    expect(nonLiteralHintsForCall(text, 'greetingKey')).toEqual({
      branchLiterals: ['app.greeting', 'notifications.logout'],
    });
    const sites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);
    const site = sites.find((s) => s.preview.includes('greetingKey'));
    expect(site?.branchLiterals).toEqual(['app.greeting', 'notifications.logout']);
  });
});

describe('non_literal hints — light-dataflow assignment chains', () => {
  it('follows a two-hop identifier chain', () => {
    const text = `
const a = 'app.x';
const b = a;
t(b);
`;
    expect(nonLiteralHintsForCall(text, 'b')).toEqual({
      resolvedViaConstAssignment: 'app.x',
    });
    const sites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);
    expect(sites.find((s) => s.kind === 'non_literal')?.resolvedViaConstAssignment).toBe('app.x');
  });

  it('follows a chain that ends in a resolved template', () => {
    const text = `
const NS = 'app';
const key = \`\${NS}.title\`;
const alias = key;
t(alias);
`;
    expect(nonLiteralHintsForCall(text, 'alias')).toEqual({
      resolvedViaConstAssignment: 'app.title',
    });
  });

  it('stops at the chain cap (does not resolve an over-long chain)', () => {
    const text = `
const a = 'app.x';
const b = a;
const c = b;
const d = c;
t(d);
`;
    expect(nonLiteralHintsForCall(text, 'd')).toEqual({});
    // One hop shorter still resolves.
    expect(nonLiteralHintsForCall(text, 'c')).toEqual({ resolvedViaConstAssignment: 'app.x' });
  });

  it('does not trust reassigned names', () => {
    const text = `
let a = 'app.x';
a = 'app.other';
t(a);
`;
    expect(nonLiteralHintsForCall(text, 'a')).toEqual({});
  });
});

describe('buildAssignmentLedger', () => {
  it('records declaration RHS and drops reassigned names', () => {
    const ledger = buildAssignmentLedger(`
const a = 'app.x';
const b = a;
let c = 'app.y';
c = 'app.z';
`);
    expect(ledger.rhs.get('a')).toBe(`'app.x'`);
    expect(ledger.rhs.get('b')).toBe('a');
    expect(ledger.rhs.has('c')).toBe(false);
  });
});

