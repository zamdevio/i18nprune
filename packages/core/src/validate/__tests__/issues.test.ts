import { describe, expect, it } from 'vitest';
import { buildValidateIssues } from '../issues.js';

describe('validate issues', () => {
  it('builds missing and dynamic warning issues', () => {
    const out = buildValidateIssues({
      missingCount: 2,
      dynamicSiteCount: 3,
      sourceLocalePath: '/tmp/locales/en.json',
    });
    expect(out).toHaveLength(2);
    expect(out[0]?.code).toBe('i18nprune.validate.missing_literal_keys');
    expect(out[0]?.path).toBe('/tmp/locales/en.json');
    expect(out[1]?.code).toBe('i18nprune.validate.dynamic_key_sites');
  });

  it('returns empty issues when no findings', () => {
    expect(
      buildValidateIssues({
        missingCount: 0,
        dynamicSiteCount: 0,
      }),
    ).toEqual([]);
  });
});
