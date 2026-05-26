import { describe, expect, it } from 'vitest';
import { parseReportShareId } from '../share/parseReportShareId.js';

describe('parseReportShareId', () => {
  it('parses hash share URL with /?id=', () => {
    expect(parseReportShareId('https://report.i18nprune.dev/#/?id=abc123def4567890')).toBe('abc123def4567890');
  });

  it('parses raw 16-char hex id', () => {
    expect(parseReportShareId('  AbC123DeF4567890  ')).toBe('AbC123DeF4567890');
  });

  it('returns null for empty or invalid input', () => {
    expect(parseReportShareId('')).toBeNull();
    expect(parseReportShareId('not-an-id')).toBeNull();
    expect(parseReportShareId('https://example.com/no-hash')).toBeNull();
  });
});
