/** Live product metadata for JSON-LD (from meta worker or build-time fallback). */
export type ProductMetaSnapshot = {
  cliVersion: string;
  coreVersion?: string;
  githubStars?: number | null;
  githubOwner?: string;
  githubRepo?: string;
};

export type OpenGraphTags = {
  title: string;
  description: string;
  url: string;
  type?: 'website' | 'article';
  siteName?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type TwitterCardTags = {
  card?: 'summary' | 'summary_large_image';
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  site?: string;
};

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type JsonLdDocument = Record<string, unknown>;

export type JsonLdGraphDocument = {
  '@context': 'https://schema.org';
  '@graph': JsonLdDocument[];
};
