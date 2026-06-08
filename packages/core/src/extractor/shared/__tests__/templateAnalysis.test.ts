import { describe, expect, it } from 'vitest';

import { scanKeyObservations } from '../../keySites/scan.js';
import { findDynamicKeySitesInJavascriptMergedText } from '../../dynamic/providers/javascript.js';
import { analyzeTemplateCall } from '../templateAnalysis.js';

describe('analyzeTemplateCall', () => {
  it('fully resolves const-only templates', () => {
    const analysis = analyzeTemplateCall('${NS}.title', { NS: 'app' });
    expect(analysis.classification).toBe('fully_resolved');
    expect(analysis.resolvedKey).toBe('app.title');
    expect(analysis.runtimeSegments).toEqual([]);
    expect(analysis.staticPrefix).toBeNull();
  });

  it('classifies mixed const + member expression templates', () => {
    const analysis = analyzeTemplateCall('${M}.statuses.${data.status}', { M: 'orders' });
    expect(analysis.classification).toBe('mixed_const_runtime');
    expect(analysis.staticPrefix).toBe('orders.statuses');
    expect(analysis.runtimeSegments).toEqual(['data.status']);
    expect(analysis.substitutions).toEqual([{ identifier: 'M', value: 'orders' }]);
  });

  it('classifies const + unknown local as mixed', () => {
    const analysis = analyzeTemplateCall('${NS}.nav.${navPage}', { NS: 'app' });
    expect(analysis.classification).toBe('mixed_const_runtime');
    expect(analysis.staticPrefix).toBe('app.nav');
    expect(analysis.unresolvedPlaceholders).toEqual(['navPage']);
  });

  it('classifies quoted literal holes as mixed runtime', () => {
    const analysis = analyzeTemplateCall("${NS}.footer.${'copyright'}", { NS: 'app' });
    expect(analysis.classification).toBe('mixed_const_runtime');
    expect(analysis.staticPrefix).toBe('app.footer');
    expect(analysis.runtimeSegments).toEqual(["'copyright'"]);
    expect(analysis.unresolvedPlaceholders).toEqual([]);
  });

  it('classifies templates with no const folds as runtime_only', () => {
    const analysis = analyzeTemplateCall('${NS}.x', {});
    expect(analysis.classification).toBe('runtime_only');
    expect(analysis.staticPrefix).toBeNull();
    expect(analysis.unresolvedPlaceholders).toEqual(['NS']);
  });
});

describe('analyzeTemplateCall scan parity', () => {
  it('keeps keySites and dynamic outcomes aligned for mixed templates', () => {
    const text = `
const M = 'orders';
t(\`\${M}.statuses.\${data.status}\`);
`;
    const constMap = { M: 'orders' };
    const observations = scanKeyObservations(text, ['t'], constMap);
    const dynamicSites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);

    const partial = observations.find((o) => o.kind === 'template_partial');
    expect(partial?.kind).toBe('template_partial');
    if (partial?.kind === 'template_partial') {
      expect(partial.uncertainPrefix).toBe('orders.statuses');
      expect(partial.dynamicRef).toEqual({ line: partial.span.line });
    }

    const dynamic = dynamicSites.find((s) => s.kind === 'template_interpolation');
    expect(dynamic?.resolvedPrefix).toBe('orders.statuses');
    expect(observations.some((o) => o.kind === 'template_resolved')).toBe(false);
  });

  it('omits dynamic sites for const-only templates', () => {
    const text = `
const NS = 'app';
t(\`\${NS}.title\`);
`;
    const constMap = { NS: 'app' };
    const observations = scanKeyObservations(text, ['t'], constMap);
    const dynamicSites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);

    expect(observations.some((o) => o.kind === 'template_resolved')).toBe(true);
    expect(dynamicSites).toEqual([]);
  });
});
