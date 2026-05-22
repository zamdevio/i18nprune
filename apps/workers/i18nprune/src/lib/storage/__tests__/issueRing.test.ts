import { describe, expect, it } from 'vitest';
import { appendStorageFailure, shouldTriggerStorageEviction } from '../issueRing.js';

describe('storage failure ring', () => {
  it('requires 10 matching signatures before eviction', () => {
    const err = new Error('storage limit exceeded');
    let ring = appendStorageFailure([], err);
    expect(shouldTriggerStorageEviction(ring)).toBe(false);
    for (let i = 0; i < 8; i++) ring = appendStorageFailure(ring, err);
    expect(shouldTriggerStorageEviction(ring)).toBe(false);
    ring = appendStorageFailure(ring, err);
    ring = appendStorageFailure(ring, err);
    expect(shouldTriggerStorageEviction(ring)).toBe(true);
  });

  it('does not trigger when signatures differ', () => {
    let ring = appendStorageFailure([], new Error('storage quota A'));
    for (let i = 0; i < 9; i++) {
      ring = appendStorageFailure(ring, new Error('storage quota B'));
    }
    expect(shouldTriggerStorageEviction(ring)).toBe(false);
  });
});
