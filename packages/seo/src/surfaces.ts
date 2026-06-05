import {
  DOCS_URL,
  LANDING_URL,
  PRODUCT_DESCRIPTION,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
  RELEASES_URL,
  REPORT_URL,
  WEB_APP_URL,
} from './constants.js';

export const SURFACE_COPY = {
  landing: {
    title: `${PRODUCT_NAME} — Compiler-grade i18n infrastructure`,
    description: PRODUCT_TAGLINE,
    url: `${LANDING_URL}/`,
    ogImage: `${LANDING_URL}/og.png`,
  },
  docs: {
    title: `${PRODUCT_NAME} Docs`,
    description:
      'Documentation for i18nprune — validate, sync, generate, and maintain locale files with the CLI and SDK.',
    url: `${DOCS_URL}/`,
  },
  releases: {
    title: `${PRODUCT_NAME} Releases`,
    description:
      'Release history for i18nprune CLI, @i18nprune/core SDK, and the VS Code extension — version notes, install snippets, and compatibility.',
    url: `${RELEASES_URL}/`,
    ogImage: `${RELEASES_URL}/og.png`,
  },
  web: {
    title: `${PRODUCT_NAME} Web Runtime`,
    description:
      'Browser playground and project explorer for i18nprune — run validate, sync, and share workflows powered by @i18nprune/core.',
    url: `${WEB_APP_URL}/`,
    ogImage: `${WEB_APP_URL}/og.png`,
  },
  report: {
    title: `${PRODUCT_NAME} · project report`,
    description:
      'Visualize i18nprune project reports in the browser — import JSON, open hosted share links, and explore locale issues and quality findings.',
    url: `${REPORT_URL}/`,
    ogImage: `${REPORT_URL}/og.png`,
  },
} as const;

export const DOCS_SITE_DESCRIPTION = SURFACE_COPY.docs.description;

export const PRODUCT_LONG_DESCRIPTION = PRODUCT_DESCRIPTION;
