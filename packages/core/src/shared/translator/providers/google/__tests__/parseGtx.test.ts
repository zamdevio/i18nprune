import { describe, it, expect } from 'vitest';
import { parseGtxResponse } from '../index.js';

describe('parseGtxResponse', () => {
  it('joins segment strings', () => {
    const json: unknown = [[['Hello'], null], null, 'en'];
    expect(parseGtxResponse(json)).toBe('Hello');
  });
});
