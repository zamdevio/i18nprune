import { describe, it, expect } from 'vitest';
import { literalKeyUsageFromObservations } from '@/core/extractor/keySites/projectUsage.js';
import { resolvedKeysFromObservations, scanKeyObservations } from '@/core/extractor/keySites/scan.js';

describe('literalKeyUsageFromObservations', () => {
  it('matches resolvedKeysFromObservations for literals and template_resolved', () => {
    const text = `
const NS = 'pages.app';
t('a.b');
t(\`\${NS}.title\`);
`;
    const obs = scanKeyObservations(text, ['t'], { NS: 'pages.app' });
    const usage = literalKeyUsageFromObservations(obs);
    const fromResolved = resolvedKeysFromObservations(obs);
    expect(usage.resolvedKeys).toEqual(fromResolved);
    expect(usage.usedRoots.has('a')).toBe(true);
    expect(usage.usedRoots.has('pages')).toBe(true);
  });

  it('does not add resolved keys for unresolved template_partial', () => {
    const obs = scanKeyObservations('t(`${NS}.x`)', ['t'], {});
    const usage = literalKeyUsageFromObservations(obs);
    expect(usage.resolvedKeys.size).toBe(0);
  });
});
