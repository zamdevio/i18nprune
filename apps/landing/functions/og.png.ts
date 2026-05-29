/**
 * Cloudflare Pages Function — Dynamic OG image (PNG)
 *
 * Renders the same share card as `/og.svg`, rasterized for Twitter, Facebook, LinkedIn, etc.
 *
 * Route: GET /og.png
 */

/// <reference types="@cloudflare/workers-types" />

import { buildOgSvg, OG_CACHE_HEADERS } from './_shared/ogCard';
import { renderSvgToPng } from './_shared/svgToPng';

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const svg = await buildOgSvg();
  const png = await renderSvgToPng(svg, origin);
  return new Response(png as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      ...OG_CACHE_HEADERS,
    },
  });
};
