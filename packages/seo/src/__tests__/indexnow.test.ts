import { describe, expect, it, vi } from 'vitest';

import {
  buildIndexNowPayload,
  buildReleasesIndexNowUrlList,
  indexNowKeyLocation,
  submitIndexNow,
} from '../indexnow.js';

describe('indexNowKeyLocation', () => {
  it('builds HTTPS key file URL for bare host', () => {
    expect(indexNowKeyLocation('releases.i18nprune.dev', 'abc123')).toBe(
      'https://releases.i18nprune.dev/abc123.txt',
    );
  });

  it('strips scheme from host input', () => {
    expect(indexNowKeyLocation('https://releases.i18nprune.dev/', 'abc123')).toBe(
      'https://releases.i18nprune.dev/abc123.txt',
    );
  });
});

describe('buildIndexNowPayload', () => {
  it('matches IndexNow JSON shape', () => {
    expect(
      buildIndexNowPayload({
        host: 'releases.i18nprune.dev',
        key: 'key1',
        urlList: ['https://releases.i18nprune.dev/cli/0.1.3'],
      }),
    ).toEqual({
      host: 'releases.i18nprune.dev',
      key: 'key1',
      keyLocation: 'https://releases.i18nprune.dev/key1.txt',
      urlList: ['https://releases.i18nprune.dev/cli/0.1.3'],
    });
  });
});

describe('buildReleasesIndexNowUrlList', () => {
  it('includes stream pages and feed/sitemap', () => {
    expect(buildReleasesIndexNowUrlList('0.1.3', ['cli', 'core'])).toEqual([
      'https://releases.i18nprune.dev/cli/0.1.3',
      'https://releases.i18nprune.dev/core/0.1.3',
      'https://releases.i18nprune.dev/sitemap.xml',
      'https://releases.i18nprune.dev/feed.xml',
    ]);
  });
});

describe('submitIndexNow', () => {
  it('POSTs JSON body to the default endpoint', async () => {
    let postedUrl = '';
    let postedInit: RequestInit | undefined;
    const fetchFn: typeof fetch = vi.fn(async (url, init) => {
      postedUrl = String(url);
      postedInit = init;
      return new Response('', { status: 200 });
    }) as typeof fetch;

    const result = await submitIndexNow(
      {
        host: 'releases.i18nprune.dev',
        key: 'k',
        urlList: ['https://releases.i18nprune.dev/cli/0.1.3'],
      },
      fetchFn,
    );

    expect(result).toEqual({ ok: true, status: 200, body: undefined });
    expect(postedUrl).toBe('https://api.indexnow.org/indexnow');
    expect(postedInit?.method).toBe('POST');
    expect(JSON.parse(String(postedInit?.body))).toEqual({
      host: 'releases.i18nprune.dev',
      key: 'k',
      keyLocation: 'https://releases.i18nprune.dev/k.txt',
      urlList: ['https://releases.i18nprune.dev/cli/0.1.3'],
    });
  });

  it('returns ok false for non-2xx responses', async () => {
    const fetchFn: typeof fetch = vi.fn(async () => new Response('bad', { status: 422 })) as typeof fetch;
    const result = await submitIndexNow(
      { host: 'releases.i18nprune.dev', key: 'k', urlList: ['https://example.com/a'] },
      fetchFn,
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(422);
    expect(result.body).toBe('bad');
  });
});
