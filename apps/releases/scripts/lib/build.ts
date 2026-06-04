import fs from 'node:fs';
import path from 'node:path';
import type { LoadedRelease } from './utils.js';

export type FeedItem = {
  title: string;
  link: string;
  guid: string;
  pubDate: Date;
  description: string;
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildFeedItems(entries: LoadedRelease[], origin: string): FeedItem[] {
  return [...entries]
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
    .map(({ stream, version, data }) => ({
      title: `${stream.toUpperCase()} v${version}`,
      link: `${origin}/${stream}/${version}`,
      guid: `${origin}/${stream}/${version}`,
      pubDate: new Date(data.date),
      description: data.summary,
    }));
}

export function buildRss2(items: FeedItem[], origin: string, generatedAt: Date): string {
  const channelItems = items
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>i18nprune Releases</title>
    <link>${escapeXml(origin)}</link>
    <description>Release notes for i18nprune CLI, Core, and VS Code extension.</description>
    <language>en</language>
    <lastBuildDate>${generatedAt.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${origin}/feed.xml`)}" rel="self" type="application/rss+xml" />${channelItems}
  </channel>
</rss>
`;
}

export function buildAtom(items: FeedItem[], origin: string, generatedAt: Date): string {
  const entries = items
    .map(
      (item) => `
  <entry>
    <title>${escapeXml(item.title)}</title>
    <link href="${escapeXml(item.link)}" />
    <id>${escapeXml(item.guid)}</id>
    <updated>${item.pubDate.toISOString()}</updated>
    <summary>${escapeXml(item.description)}</summary>
  </entry>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>i18nprune Releases</title>
  <link href="${escapeXml(origin)}" />
  <link href="${escapeXml(`${origin}/atom.xml`)}" rel="self" type="application/atom+xml" />
  <id>${escapeXml(origin)}/</id>
  <updated>${generatedAt.toISOString()}</updated>${entries}
</feed>
`;
}

export type SitemapUrl = {
  loc: string;
  lastmod: string;
};

export function buildSitemapUrls(items: FeedItem[], origin: string, generatedAt: Date): SitemapUrl[] {
  const lastmod = generatedAt.toISOString().slice(0, 10);
  const staticPaths = [
    '',
    '/cli',
    '/core',
    '/extension',
    '/search',
    '/compare/cli',
    '/compare/core',
    '/compare/extension',
  ];

  const urls: SitemapUrl[] = staticPaths.map((p) => ({
    loc: `${origin}${p}`,
    lastmod,
  }));

  for (const item of items) {
    urls.push({
      loc: item.link,
      lastmod: item.pubDate.toISOString().slice(0, 10),
    });
  }

  return urls;
}

export function buildSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map(
      (u) => `
  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>
`;
}

export function writeFeeds(
  entries: LoadedRelease[],
  origin: string,
  publicDir: string,
): void {
  const generatedAt = new Date();
  const items = buildFeedItems(entries, origin);
  const rss = buildRss2(items, origin, generatedAt);
  const atom = buildAtom(items, origin, generatedAt);
  const sitemap = buildSitemapXml(buildSitemapUrls(items, origin, generatedAt));
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'feed.xml'), rss);
  fs.writeFileSync(path.join(publicDir, 'atom.xml'), atom);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
}
