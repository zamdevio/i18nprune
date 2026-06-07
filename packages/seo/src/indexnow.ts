import { DOCS_URL, GIT_URL, LANDING_URL, RELEASES_URL } from './constants.js';

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

/**
 * Public IndexNow verification key (served as `/<key>.txt` on each indexed host).
 * Same value as `INDEXNOW_KEY` env when pinging.
 */
export const INDEXNOW_PUBLIC_KEY = '7e4a9c1f2b8d6e3a5c0f1b9d8e7a6c4' as const;

export const INDEXNOW_PRESET_HOSTS = {
  releases: 'releases.i18nprune.dev',
  docs: 'docs.i18nprune.dev',
  landing: 'i18nprune.dev',
  git: 'git.i18nprune.dev',
} as const;

export type IndexNowPresetId = keyof typeof INDEXNOW_PRESET_HOSTS;

export const RELEASES_INDEXNOW_HOST = INDEXNOW_PRESET_HOSTS.releases;

const PRESET_ORIGINS: Record<IndexNowPresetId, string> = {
  releases: RELEASES_URL,
  docs: DOCS_URL,
  landing: LANDING_URL,
  git: GIT_URL,
};

/** Canonical site origin for a built-in IndexNow preset. */
export function indexNowPresetOrigin(preset: IndexNowPresetId): string {
  return PRESET_ORIGINS[preset];
}

/**
 * Default URL list for sitemap-first hosts: home + sitemap.xml.
 * Use for docs, landing, and git after deploy.
 */
export function buildSitemapIndexNowUrlList(
  origin: string,
  extraPaths: readonly string[] = [],
): string[] {
  const base = origin.replace(/\/$/, '');
  const urls: string[] = [`${base}/`];
  for (const path of extraPaths) {
    urls.push(path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`);
  }
  urls.push(`${base}/sitemap.xml`);
  return [...new Set(urls)];
}

export const PINGABLE_RELEASE_STREAMS = ['cli', 'core', 'extension'] as const;

export type PingableReleaseStream = (typeof PINGABLE_RELEASE_STREAMS)[number];

export type ReleaseStreamVersion = {
  stream: PingableReleaseStream;
  version: string;
};

/**
 * Parse `--stream cli,core` and/or `--stream cli:0.1.3,core:0.1.4` tokens.
 * When tokens omit a version, `defaultVersion` is required.
 */
export function parseReleaseStreamEntries(
  streamTokens: readonly string[],
  defaultVersion: string | null,
): ReleaseStreamVersion[] {
  const flat = streamTokens.flatMap((token) =>
    token
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  );

  if (flat.length === 0) {
    if (!defaultVersion) {
      throw new Error('--preset releases requires --version or --stream with embedded versions (stream:version)');
    }
    return PINGABLE_RELEASE_STREAMS.map((stream) => ({ stream, version: defaultVersion }));
  }

  const entries: ReleaseStreamVersion[] = [];
  for (const part of flat) {
    const colon = part.indexOf(':');
    const stream = colon === -1 ? part : part.slice(0, colon);
    const version = colon === -1 ? defaultVersion : part.slice(colon + 1);
    if (!stream) {
      throw new Error(`Invalid --stream token "${part}"`);
    }
    if (!(PINGABLE_RELEASE_STREAMS as readonly string[]).includes(stream)) {
      throw new Error(`Unknown release stream "${stream}" (expected cli, core, or extension)`);
    }
    if (!version) {
      throw new Error(`--stream ${stream} requires --version or ${stream}:X.Y.Z form`);
    }
    entries.push({ stream: stream as PingableReleaseStream, version });
  }
  return entries;
}

/**
 * Build releases IndexNow URL list. Each entry may use a different stream version.
 * Caller should omit entries with no on-disk YAML (auto-skip happens upstream).
 */
export function buildReleasesIndexNowUrlList(
  entries: readonly ReleaseStreamVersion[],
  origin: string = RELEASES_URL,
): string[] {
  const base = origin.replace(/\/$/, '');
  const urls = entries.map(({ stream, version }) => `${base}/${stream}/${version}`);
  urls.push(`${base}/sitemap.xml`, `${base}/feed.xml`);
  return [...new Set(urls)];
}
