import { describe, it, expect } from 'vitest';
import { resolveReferenceConfig } from '../resolveConfig.js';
import type { ReferenceConfigSource } from '../../../types/reference/index.js';

describe('resolveReferenceConfig', () => {
  it('merges defaults and per-operation overrides', () => {
    const cfg = {
      reference: {
        defaults: { uncertainKeyPolicy: 'allow' as const, stringPresence: 'off' as const },
        commands: { cleanup: { stringPresence: 'guard' as const } },
      },
    } satisfies ReferenceConfigSource;
    const c = resolveReferenceConfig('cleanup', cfg);
    expect(c.uncertainKeyPolicy).toBe('allow');
    expect(c.stringPresence).toBe('guard');
    const g = resolveReferenceConfig('generate', cfg);
    expect(g.stringPresence).toBe('off');
  });

  it('merges legacy reference.commands.fill into generate', () => {
    const cfg = {
      reference: {
        defaults: { respectPreserve: true },
        commands: {
          fill: { respectPreserve: false },
          generate: { uncertainKeyPolicy: 'allow' as const },
        },
      },
    } satisfies ReferenceConfigSource;
    const g = resolveReferenceConfig('generate', cfg);
    expect(g.respectPreserve).toBe(false);
    expect(g.uncertainKeyPolicy).toBe('allow');
  });
});
