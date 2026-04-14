import { describe, it, expect } from 'vitest';
import { isPublishedVersionNewer } from '../registry.js';

describe('isPublishedVersionNewer', () => {
  it('returns true when patch is newer', () => {
    expect(isPublishedVersionNewer('0.1.1', '0.1.0')).toBe(true);
  });

  it('returns true when minor is newer', () => {
    expect(isPublishedVersionNewer('0.2.0', '0.1.0')).toBe(true);
  });

  it('returns false when equal', () => {
    expect(isPublishedVersionNewer('1.0.0', '1.0.0')).toBe(false);
  });

  it('returns false when older', () => {
    expect(isPublishedVersionNewer('0.1.0', '0.2.0')).toBe(false);
  });
});
