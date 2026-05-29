/**
 * Cloudflare Pages Function — Dynamic OG image (SVG)
 *
 * Route: GET /og.svg
 */

/// <reference types="@cloudflare/workers-types" />

import { buildOgSvg, OG_CACHE_HEADERS } from './_shared/ogCard';

export const onRequestGet: PagesFunction = async () => {
  const svg = await buildOgSvg();
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      ...OG_CACHE_HEADERS,
    },
  });
};
