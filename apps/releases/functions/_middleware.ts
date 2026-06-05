/// <reference types="@cloudflare/workers-types" />

import { createPagesDevRedirectMiddleware } from '@i18nprune/seo/pages/middleware';

export const onRequest = createPagesDevRedirectMiddleware('releases');
