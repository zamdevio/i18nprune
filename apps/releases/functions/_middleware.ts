/// <reference types="@cloudflare/workers-types" />

import { createPagesDevRedirectMiddleware } from '@i18nprune/seo/pages/middleware';

const redirectPagesDev = createPagesDevRedirectMiddleware('releases');

const STREAMS = new Set(['cli', 'core', 'extension']);
/** Canonical human route: `/cli/1.1.1`, `/core/1.1.1`, … */
const RELEASE_PATH = /^\/(cli|core|extension)\/([0-9][0-9A-Za-z.+-]*)\/?$/;

/**
 * Content negotiation for the canonical release route.
 *
 * Browsers (`Accept: text/html`) get the SPA shell. Clients that ask for
 * `application/json` — the CLI, agents, scripts — get the version's record from
 * `/releases/<stream>/<version>.json` instead, so the same URL is both human- and
 * machine-readable without scraping the SPA.
 */
async function maybeServeReleaseJson(
  context: EventContext<unknown, string, Record<string, unknown>>,
): Promise<Response | null> {
  const accept = (context.request.headers.get('Accept') ?? '').toLowerCase();
  if (!accept.includes('application/json') || accept.includes('text/html')) return null;

  const match = RELEASE_PATH.exec(new URL(context.request.url).pathname);
  if (!match) return null;
  const [, stream, version] = match;
  if (!STREAMS.has(stream!)) return null;

  const assets = (context.env as { ASSETS?: Fetcher }).ASSETS;
  if (!assets) return null;

  const assetUrl = new URL(context.request.url);
  assetUrl.pathname = `/releases/${stream}/${version}.json`;
  assetUrl.search = '';

  const asset = await assets.fetch(assetUrl.toString());
  if (!asset.ok) return null;

  return new Response(asset.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const onRequest: PagesFunction = async (context) => {
  const json = await maybeServeReleaseJson(context);
  if (json) return json;
  return redirectPagesDev(context);
};
