import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseReportShareId, readReportShareIdFromLocation } from '../share/parseReportShareId.js';

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

describe('readReportShareIdFromLocation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads id from #/?id= hash route', () => {
    vi.stubGlobal('window', { location: { hash: '#/?id=a4da1f67c798a713' } });
    expect(readReportShareIdFromLocation()).toBe('a4da1f67c798a713');
  });

  it('returns null when hash has no query', () => {
    vi.stubGlobal('window', { location: { hash: '#/missing' } });
    expect(readReportShareIdFromLocation()).toBeNull();
  });
});
