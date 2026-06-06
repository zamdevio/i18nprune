import {
  DOCS_URL,
  GITHUB_REPO_URL,
  LANDING_URL,
  LICENSE_URL,
  NPM_PACKAGE_URL,
  PRODUCT_DESCRIPTION,
  PRODUCT_NAME,
  PRODUCT_SOFTWARE_ID,
  PRODUCT_WEBSITE_ID,
  RELEASES_URL,
  REPORT_URL,
  WEB_APP_URL,
  GIT_URL,
} from './constants.js';
import type {
  BreadcrumbItem,
  JsonLdDocument,
  JsonLdGraphDocument,
  ProductMetaSnapshot,
} from './types.js';

export function buildSoftwareApplication(
  snapshot: ProductMetaSnapshot,
  options?: { url?: string; description?: string },
): JsonLdDocument {
  return {
    '@type': 'SoftwareApplication',
    '@id': PRODUCT_SOFTWARE_ID,
    name: PRODUCT_NAME,
    url: options?.url ?? LANDING_URL,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    softwareVersion: snapshot.cliVersion,
    description: options?.description ?? PRODUCT_DESCRIPTION,
    downloadUrl: NPM_PACKAGE_URL,
    codeRepository: GITHUB_REPO_URL,
    license: LICENSE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function buildWebSite(options: {
  url: string;
  name: string;
  description: string;
  id?: string;
  publisherId?: string;
}): JsonLdDocument {
  const id = options.id ?? `${options.url.replace(/\/$/, '')}/#website`;
  return {
    '@type': 'WebSite',
    '@id': id,
    url: options.url,
    name: options.name,
    description: options.description,
    ...(options.publisherId ? { publisher: { '@id': options.publisherId } } : {}),
  };
}

export function buildLandingGraph(snapshot: ProductMetaSnapshot): JsonLdGraphDocument {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebSite({
        url: `${LANDING_URL}/`,
        name: PRODUCT_NAME,
        description: PRODUCT_DESCRIPTION,
        id: PRODUCT_WEBSITE_ID,
        publisherId: PRODUCT_SOFTWARE_ID,
      }),
      buildSoftwareApplication(snapshot, { url: `${LANDING_URL}/` }),
    ],
  };
}

export function buildWebApplication(options: {
  name: string;
  url: string;
  description: string;
}): JsonLdGraphDocument {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: options.name,
        url: options.url,
        description: options.description,
        applicationCategory: 'DeveloperApplication',
        browserRequirements: 'Requires JavaScript',
        isPartOf: { '@id': PRODUCT_SOFTWARE_ID },
      },
    ],
  };
}

export function buildWebRuntimeGraph(): JsonLdGraphDocument {
  return buildWebApplication({
    name: 'i18nprune Web Runtime',
    url: `${WEB_APP_URL}/`,
    description: 'Browser playground and explorer powered by @i18nprune/core.',
  });
}

export function buildReportRuntimeGraph(): JsonLdGraphDocument {
  return buildWebApplication({
    name: 'i18nprune Report UI',
    url: `${REPORT_URL}/`,
    description:
      'Visualize i18nprune project reports in the browser — import JSON, open hosted share links, and explore locale issues.',
  });
}

export function buildReleasesPortalGraph(snapshot: ProductMetaSnapshot): JsonLdGraphDocument {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebSite({
        url: `${RELEASES_URL}/`,
        name: 'i18nprune Releases',
        description:
          'Release history for i18nprune CLI, @i18nprune/core SDK, and the VS Code extension.',
        id: `${RELEASES_URL}/#website`,
        publisherId: PRODUCT_SOFTWARE_ID,
      }),
      {
        '@type': 'CollectionPage',
        name: 'i18nprune Releases',
        url: `${RELEASES_URL}/`,
        isPartOf: { '@id': `${RELEASES_URL}/#website` },
        about: { '@id': PRODUCT_SOFTWARE_ID },
      },
      buildSoftwareApplication(snapshot, {
        url: `${RELEASES_URL}/`,
        description:
          'Release streams for the i18nprune CLI, core SDK, and editor extension.',
      }),
    ],
  };
}

export function buildGitAnalyticsGraph(snapshot: ProductMetaSnapshot): JsonLdGraphDocument {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebSite({
        url: `${GIT_URL}/`,
        name: 'i18nprune Git Analytics',
        description:
          'Public git analytics for the i18nprune monorepo — commits, timeline, authors, tags, and branches.',
        id: `${GIT_URL}/#website`,
        publisherId: PRODUCT_SOFTWARE_ID,
      }),
      {
        '@type': 'CollectionPage',
        name: 'i18nprune Git Analytics',
        url: `${GIT_URL}/`,
        isPartOf: { '@id': `${GIT_URL}/#website` },
        about: { '@id': PRODUCT_SOFTWARE_ID },
      },
      buildSoftwareApplication(snapshot, {
        url: `${GIT_URL}/`,
        description: 'Explore i18nprune development history and repository activity.',
      }),
    ],
  };
}

export function buildApiDocsWebPage(options: {
  name: string;
  url: string;
  description: string;
}): JsonLdGraphDocument {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: options.name,
        url: options.url,
        description: options.description,
        isPartOf: { '@id': PRODUCT_SOFTWARE_ID },
        about: { '@id': PRODUCT_SOFTWARE_ID },
      },
    ],
  };
}

export function buildTechArticle(options: {
  headline: string;
  description: string;
  url: string;
}): JsonLdGraphDocument {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebSite({
        url: `${DOCS_URL}/`,
        name: `${PRODUCT_NAME} Docs`,
        description: `Documentation for ${PRODUCT_NAME}.`,
        id: `${DOCS_URL}/#website`,
        publisherId: PRODUCT_SOFTWARE_ID,
      }),
      {
        '@type': 'TechArticle',
        headline: options.headline,
        description: options.description,
        url: options.url,
        isPartOf: { '@id': `${DOCS_URL}/#website` },
      },
    ],
  };
}

export function buildBreadcrumbList(items: BreadcrumbItem[]): JsonLdGraphDocument {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    ],
  };
}

export function mergeJsonLdGraphs(...graphs: JsonLdGraphDocument[]): JsonLdGraphDocument {
  const merged: JsonLdDocument[] = [];
  for (const graph of graphs) {
    merged.push(...graph['@graph']);
  }
  return {
    '@context': 'https://schema.org',
    '@graph': merged,
  };
}
