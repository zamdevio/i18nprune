import { describe, expect, it } from 'vitest';
import { isDurableObjectStorageError, storageErrorSignature } from '../detect.js';

describe('isDurableObjectStorageError', () => {
  it('matches storage quota style messages', () => {
    expect(isDurableObjectStorageError(new Error('Durable Object storage limit exceeded'))).toBe(true);
    expect(isDurableObjectStorageError(new Error('storage API exceeded its account limits'))).toBe(true);
  });

  it('rejects generic failures', () => {
    expect(isDurableObjectStorageError(new Error('fetch failed'))).toBe(false);
    expect(isDurableObjectStorageError(new Error('internal error'))).toBe(false);
  });

  it('normalizes signatures for the issue ring', () => {
    expect(storageErrorSignature(new Error('limit 12345 exceeded'))).toBe(
      storageErrorSignature(new Error('limit 99999 exceeded')),
    );
  });
});
