import { describe, expect, it } from 'vitest';
import { buildQualityJsonData } from '../index.js';

describe('quality index helpers', () => {
  it('buildQualityJsonData maps fields into stable payload shape', () => {
    expect(
      buildQualityJsonData({
        total: 3,
        perFile: { 'ja.json': 2, 'ar.json': 1 },
        dynamicKeySites: 4,
        sourceLocale: 'en',
        localesDir: 'locales',
        localeCount: 3,
        targetLocaleCount: 2,
        files: [
          {
            code: 'en',
            file: 'en.json',
            segmentCount: 1,
            segmentRelativePaths: ['en.json'],
            leafCount: 3,
            isSourceLocale: true,
            sourceIdenticalLeafCount: null,
          },
        ],
      }),
    ).toEqual({
      total: 3,
      perFile: { 'ja.json': 2, 'ar.json': 1 },
      dynamicKeySites: 4,
      sourceLocale: 'en',
      localesDir: 'locales',
      localeCount: 3,
      targetLocaleCount: 2,
      files: [
        {
          code: 'en',
          file: 'en.json',
          segmentCount: 1,
          segmentRelativePaths: ['en.json'],
          leafCount: 3,
          isSourceLocale: true,
          sourceIdenticalLeafCount: null,
        },
      ],
    });
  });
});
