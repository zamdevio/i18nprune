import type { CanonicalHostKey } from './constants.js';
import { CANONICAL_HOSTS } from './constants.js';

export type CloudflareDefaultHostSuffix = '.pages.dev' | '.workers.dev';

/**
 * When the request hits a Cloudflare default hostname, return the 301 target URL
 * on the custom domain (path + query preserved). Otherwise return null.
 */
export function cloudflareDefaultHostRedirect(
  requestUrl: string,
  canonicalHost: string,
  suffix: CloudflareDefaultHostSuffix,
): string | null {
  const url = new URL(requestUrl);
  if (!url.hostname.endsWith(suffix)) return null;
  url.hostname = canonicalHost;
  return url.toString();
}

export function cloudflareDefaultHostRedirectFor(
  requestUrl: string,
  hostKey: CanonicalHostKey,
  suffix: CloudflareDefaultHostSuffix,
): string | null {
  return cloudflareDefaultHostRedirect(requestUrl, CANONICAL_HOSTS[hostKey], suffix);
}
