import { describe, expect, it } from 'vitest';

import { nonLiteralHintsForCall } from '../hints.js';
import { findDynamicKeySitesInJavascriptMergedText } from '../providers/javascript.js';

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
