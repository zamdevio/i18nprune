import { describe, expect, it } from 'vitest';
import {
  classifySyncRetainedExtraReason,
  classifySyncRetainedExtras,
} from '../retainReasons.js';

describe('classifySyncRetainedExtraReason', () => {
  it('prefers copyKey over prefix', () => {
    expect(
      classifySyncRetainedExtraReason('brand.tagline', {
        preserve: { copyKeys: ['brand.tagline'], copyPrefixes: ['brand.'] },
      }),
    ).toBe('copyKey');
  });

  it('matches copyPrefixes with trailing-dot startsWith', () => {
    expect(
      classifySyncRetainedExtraReason('navigation.items.home', {
        preserve: { copyPrefixes: ['navigation.'] },
      }),
    ).toBe('copyPrefix');
  });

  it('matches declared uncertainPrefixes', () => {
    expect(
      classifySyncRetainedExtraReason('seo.routes.about', {
        preserve: { uncertainPrefixes: ['seo.routes'] },
      }),
    ).toBe('uncertainPrefix');
  });

  it('matches auto uncertain prefixes', () => {
    expect(
      classifySyncRetainedExtraReason('seo.routes.about', {
        autoUncertainPrefixes: ['seo.routes'],
      }),
    ).toBe('autoUncertain');
  });

  it('returns undefined when unmatched', () => {
    expect(classifySyncRetainedExtraReason('other.x', {})).toBeUndefined();
  });

  it('classifySyncRetainedExtras drops unclassified', () => {
    expect(
      classifySyncRetainedExtras(['navigation.a', 'other.x'], {
        preserve: { copyPrefixes: ['navigation.'] },
      }),
    ).toEqual([{ path: 'navigation.a', reason: 'copyPrefix' }]);
  });
});
