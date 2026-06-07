import { RELEASES_URL } from './constants.js';

/** Default IndexNow API endpoint (Bing and protocol partners). */
export const INDEXNOW_DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow' as const;

export type SubmitIndexNowInput = {
  host: string;
  key: string;
  urlList: string[];
  endpoint?: string;
};

export type SubmitIndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

export type SubmitIndexNowResult = {
  ok: boolean;
  status: number;
  body?: string;
};

/** Normalize host to bare hostname (no scheme, no trailing slash). */
export function normalizeIndexNowHost(host: string): string {
  return host.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** `https://<host>/<key>.txt` — required IndexNow key verification URL. */
export function indexNowKeyLocation(host: string, key: string): string {
  return `https://${normalizeIndexNowHost(host)}/${key}.txt`;
}

export function buildIndexNowPayload(input: SubmitIndexNowInput): SubmitIndexNowPayload {
  const host = normalizeIndexNowHost(input.host);
  return {
    host,
    key: input.key,
    keyLocation: indexNowKeyLocation(host, input.key),
    urlList: [...input.urlList],
  };
}

export async function submitIndexNow(
  input: SubmitIndexNowInput,
  fetchFn: typeof fetch = fetch,
): Promise<SubmitIndexNowResult> {
  const endpoint = input.endpoint ?? INDEXNOW_DEFAULT_ENDPOINT;
  const payload = buildIndexNowPayload(input);
  const res = await fetchFn(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    body: body.length > 0 ? body : undefined,
  };
}

/** Releases portal hostname (IndexNow `host` field). */
export const RELEASES_INDEXNOW_HOST = 'releases.i18nprune.dev' as const;

/**
 * Build default releases IndexNow URL list for a semver bump.
 * Pass streams that have YAML on disk (typically `cli` and/or `core`; skip `extension` until shipped).
 */
export function buildReleasesIndexNowUrlList(
  version: string,
  streams: readonly string[],
  origin: string = RELEASES_URL,
): string[] {
  const base = origin.replace(/\/$/, '');
  const urls = streams.map((stream) => `${base}/${stream}/${version}`);
  urls.push(`${base}/sitemap.xml`, `${base}/feed.xml`);
  return urls;
}
