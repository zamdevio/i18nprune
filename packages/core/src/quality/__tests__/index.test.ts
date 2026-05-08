import { describe, expect, it } from 'vitest';
import { buildQualityJsonData } from '../index.js';

describe('quality index helpers', () => {
  it('buildQualityJsonData maps fields into stable payload shape', () => {
    expect(
      buildQualityJsonData({
        total: 3,
        perFile: { 'ja.json': 2, 'ar.json': 1 },
        dynamicKeySites: 4,
      }),
    ).toEqual({
      total: 3,
      perFile: { 'ja.json': 2, 'ar.json': 1 },
      dynamicKeySites: 4,
    });
  });
});
