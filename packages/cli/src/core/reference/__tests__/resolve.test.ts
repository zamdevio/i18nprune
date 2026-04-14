import { describe, it, expect } from 'vitest';
import { resolveReferenceConfig } from '@/core/reference/resolve.js';
import type { I18nPruneConfig } from '@/types/config/index.js';

describe('resolveReferenceConfig', () => {
  it('merges defaults and command overrides', () => {
    const cfg = {
      source: 'l/en.json',
      localesDir: 'l',
      src: 's',
      functions: ['t'],
      reference: {
        defaults: { uncertainKeyPolicy: 'allow' as const, stringPresence: 'off' as const },
        commands: { cleanup: { stringPresence: 'guard' as const } },
      },
    } satisfies I18nPruneConfig;
    const c = resolveReferenceConfig('cleanup', cfg);
    expect(c.uncertainKeyPolicy).toBe('allow');
    expect(c.stringPresence).toBe('guard');
    const f = resolveReferenceConfig('fill', cfg);
    expect(f.stringPresence).toBe('off');
  });
});
