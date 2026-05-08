import { describe, expect, it } from 'vitest';
import { resolveMissingPathsPlan } from '../resolvePaths.js';

describe('missing resolvePathsPlan', () => {
  it('computes missing from resolved keys when no report is provided', () => {
    const out = resolveMissingPathsPlan({
      localeJson: { home: { title: 'Home' } },
      resolvedKeys: new Set(['home.title', 'home.subtitle']),
    });
    expect(out).toEqual({
      toAdd: ['home.subtitle'],
      skippedNotInScan: [],
    });
  });

  it('filters report paths against current scan and existing leaves', () => {
    const out = resolveMissingPathsPlan({
      localeJson: { home: { title: 'Home' } },
      resolvedKeys: new Set(['home.title', 'home.subtitle']),
      reportMissingPaths: ['home.subtitle', 'orphan.path'],
    });
    expect(out).toEqual({
      toAdd: ['home.subtitle'],
      skippedNotInScan: ['orphan.path'],
    });
  });
});
