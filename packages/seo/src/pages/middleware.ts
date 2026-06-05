/// <reference types="@cloudflare/workers-types" />

import type { CanonicalHostKey } from '../constants.js';
import { cloudflareDefaultHostRedirectFor } from '../redirect.js';

/** 301 redirect `*.pages.dev` hostnames to the canonical custom domain for a surface. */
export function createPagesDevRedirectMiddleware(hostKey: CanonicalHostKey): PagesFunction {
  return async (context) => {
    const target = cloudflareDefaultHostRedirectFor(context.request.url, hostKey, '.pages.dev');
    if (target) return Response.redirect(target, 301);
    return context.next();
  };
}
