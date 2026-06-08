import { describe, expect, it } from 'vitest';

import { dynamicSiteDetailLines } from '../formatSiteDetail.js';
import { findDynamicKeySitesInJavascriptMergedText } from '../providers/javascript.js';

describe('dynamic template fields (E.1c)', () => {
  it('attaches staticPrefix, runtimeSegments, classification, and constSubstitutions', () => {
    const text = `
const M = 'orders';
t(\`\${M}.statuses.\${data.status}\`);
`;
    const sites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);
    const site = sites.find((s) => s.kind === 'template_interpolation');
    expect(site).toMatchObject({
      staticPrefix: 'orders.statuses',
      resolvedPrefix: 'orders.statuses',
      classification: 'mixed_const_runtime',
      runtimeSegments: ['data.status'],
      constSubstitutions: [{ identifier: 'M', value: 'orders' }],
    });
  });

  it('formats human detail lines for mixed templates', () => {
    const text = "const NS = 'app';\nt(`${NS}.footer.${'copyright'}`);";
    const sites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);
    const site = sites[0]!;
    expect(dynamicSiteDetailLines(site)).toEqual([
      'static prefix: app.footer',
      'const folds: NS → app',
      "runtime holes: 'copyright'",
      'classification: mixed_const_runtime',
    ]);
  });

  it('omits detail lines for non-template dynamic sites', () => {
    const sites = findDynamicKeySitesInJavascriptMergedText('t(maybeKey);', ['t']);
    expect(dynamicSiteDetailLines(sites[0]!)).toEqual([]);
  });
});
