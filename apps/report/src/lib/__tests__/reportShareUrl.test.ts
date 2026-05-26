import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildHostedReportShareUrl,
  resolveCopyShareLink,
  resolveReportShareAppBase,
} from '../share/reportShareUrl.js';

describe('reportShareUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses current origin for hosted share links', () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } });
    expect(buildHostedReportShareUrl('abc123def4567890')).toBe(
      'http://localhost:5173/#/?id=abc123def4567890',
    );
  });

  it('resolveCopyShareLink rebuilds from report id', () => {
    vi.stubGlobal('window', { location: { origin: 'https://report.example.com' } });
    expect(
      resolveCopyShareLink({
        reportId: 'abc123def4567890',
        link: 'https://report.i18nprune.dev/#/?id=abc123def4567890',
      }),
    ).toBe('https://report.example.com/#/?id=abc123def4567890');
  });

  it('resolveCopyShareLink parses id from legacy link', () => {
    vi.stubGlobal('window', { location: { origin: 'http://127.0.0.1:4173' } });
    expect(
      resolveCopyShareLink({
        link: 'https://report.i18nprune.dev/#/?id=deadbeefdeadbeef',
      }),
    ).toBe('http://127.0.0.1:4173/#/?id=deadbeefdeadbeef');
  });

  it('falls back to demo report URL without window', () => {
    vi.stubGlobal('window', undefined as unknown as Window & typeof globalThis);
    expect(resolveReportShareAppBase()).toBe('https://report.i18nprune.dev');
  });
});
