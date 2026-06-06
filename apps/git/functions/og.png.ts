/**
 * Cloudflare Pages Function — Dynamic OG image (PNG)
 *
 * Route: GET /og.png
 */

/// <reference types="@cloudflare/workers-types" />

import { buildOgSvg, OG_CACHE_HEADERS, renderSvgToPng } from '@i18nprune/seo/og';

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
